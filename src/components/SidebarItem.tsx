import React from 'react';
import { ChevronDown, LucideIcon, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  view?: string;
  badge?: string;
  subItems?: { label: string; view: any; icon: LucideIcon; onClick?: () => void; isActive?: boolean; badge?: string }[];
  onClick?: () => void;
  isActive?: boolean;
  isTrigger?: boolean;
  isSidebarCollapsed: boolean;
  currentView: string;
  expandedItems: Set<string>;
  toggleExpand: (label: string) => void;
  setCurrentView: (view: any) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const SidebarItem = React.memo(({ 
  icon: Icon, 
  label, 
  view, 
  badge, 
  subItems, 
  onClick, 
  isActive: customIsActive, 
  isTrigger,
  isSidebarCollapsed,
  currentView,
  expandedItems,
  toggleExpand,
  setCurrentView,
  setIsMobileMenuOpen
}: SidebarItemProps) => {
  const isActive = customIsActive !== undefined ? customIsActive : currentView === view;
  const isExpanded = expandedItems.has(label);
  
  const itemClassName = `w-full justify-start text-sm font-medium transition-all duration-200 group relative flex items-center ${
    isActive 
      ? 'bg-red-500/10 text-red-600' 
      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
  } ${isSidebarCollapsed ? 'px-0 justify-center h-12' : 'px-4 h-10 rounded-lg mx-2 w-[calc(100%-16px)]'}`;

  const itemInner = (
    <>
      <Icon className={`w-5 h-5 shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'} ${isActive ? 'text-red-600' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-transform'}`} />
      {!isSidebarCollapsed && (
        <>
          <span className="flex-1 text-left truncate">{label}</span>
          {badge && (
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-secondary text-foreground border-none">
              {badge}
            </Badge>
          )}
          {subItems && (
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          )}
        </>
      )}
      {isActive && (
        <div className={`absolute top-2 bottom-2 w-1 bg-red-600 rounded-full ${isSidebarCollapsed ? 'right-0' : 'left-0'}`} />
      )}
    </>
  );

  const content = (
    <div className="w-full">
      {isTrigger ? (
        <div className={itemClassName}>
          {itemInner}
        </div>
      ) : (
        <Button 
          variant="ghost" 
          className={itemClassName}
          onClick={() => {
            if (onClick) {
              onClick();
              setIsMobileMenuOpen(false);
            }
            else if (subItems) {
              if (!isSidebarCollapsed) toggleExpand(label);
            }
            else if (view) {
              setCurrentView(view);
              setIsMobileMenuOpen(false);
            }
          }}
        >
          {itemInner}
        </Button>
      )}
      
      {!isSidebarCollapsed && subItems && isExpanded && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-2 animate-in slide-in-from-left-2 duration-200">
          {subItems.map((sub, i) => (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              className={`w-full justify-start text-xs font-medium ${
                (sub.isActive !== undefined ? sub.isActive : currentView === sub.view) ? 'text-red-600 bg-red-500/5' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                if (sub.onClick) sub.onClick();
                else setCurrentView(sub.view);
                setIsMobileMenuOpen(false);
              }}
            >
              <sub.icon className="w-5 h-5 mr-2 shrink-0" />
              <span className="truncate flex-1">{sub.label}</span>
              {sub.badge && (
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-secondary text-foreground border-none">
                  {sub.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  if (isSidebarCollapsed) {
    const itemContent = subItems ? (
      <DropdownMenu>
        <DropdownMenuTrigger nativeButton={false} render={(props: any) => (
          <div {...props} className="w-full cursor-pointer">
            <SidebarItem 
              icon={Icon} 
              label={label} 
              isActive={isActive} 
              isTrigger 
              isSidebarCollapsed={isSidebarCollapsed}
              currentView={currentView}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              setCurrentView={setCurrentView}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
          </div>
        )} />
        <DropdownMenuContent side="right" align="start" className="w-56 ml-2 bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl p-1.5">
          <div className="px-2 py-1.5 mb-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{label}</p>
          </div>
          <DropdownMenuSeparator className="bg-primary/10 mb-1" />
          <DropdownMenuGroup>
            {subItems.map((sub, i) => {
              const isSubActive = sub.isActive !== undefined ? sub.isActive : currentView === sub.view;
              return (
                <DropdownMenuItem 
                  key={i} 
                  onClick={() => {
                    if (sub.onClick) sub.onClick();
                    else setCurrentView(sub.view);
                  }}
                  className={`flex items-center gap-3 p-2.5 cursor-pointer rounded-lg transition-all duration-200 ${
                    isSubActive 
                      ? 'bg-red-500/10 text-red-600 font-bold' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <sub.icon className={`w-4 h-4 ${isSubActive ? 'text-red-600' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <span className="text-xs flex-1">{sub.label}</span>
                  {sub.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-secondary text-foreground border-none">
                      {sub.badge}
                    </Badge>
                  )}
                  {isSubActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(255,43,43,0.5)]" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : content;

    return (
      <Tooltip>
        <TooltipTrigger render={(props: any) => <div {...props}>{itemContent}</div>} />
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
          {subItems && <ChevronRight className="w-3 h-3 opacity-50" />}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
});

export default SidebarItem;

