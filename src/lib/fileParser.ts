import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export const parseFileToString = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    try {
      if (fileName.endsWith('.docx')) {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const textContent = jsonData
              .filter((row: any) => row.length > 0)
              .map((row: any) => row.join('\t'))
              .join('\n');
              
            resolve(textContent);
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (fileName.endsWith('.pptx')) {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const zip = await JSZip.loadAsync(arrayBuffer);
            let fullText = "";
            
            const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
            for (const slideFile of slideFiles) {
              const content = await zip.file(slideFile)?.async('text');
              if (content) {
                const matches = content.match(/<a:t>([^<]+)<\/a:t>/g);
                if (matches) {
                  const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
                  fullText += `Slide: ${slideText}\n\n`;
                }
              }
            }
            resolve(fullText);
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (fileName.endsWith('.pdf')) {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += `Page ${i}:\n${pageText}\n\n`;
              } catch (pageError) {
                console.warn(`Error extraction text from PDF page ${i}:`, pageError);
              }
            }
            resolve(fullText);
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve(content);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      reject(error);
    }
  });
};

