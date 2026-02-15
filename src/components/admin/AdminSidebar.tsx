import { 
  ShoppingCart, 
  FileText, 
  Calendar, 
  Truck, 
  BarChart3,
  FolderOpen,
  ChevronDown,
  CircleDollarSign,
  Users,
  PieChart,
  Settings,
  LayoutGrid,
  Play,
  Database,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';
import logo44Trans from '@/assets/logo-44trans.png';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSuperAdmin?: boolean;
}

const managementItems = [
  { id: 'bookings', title: 'Pesanan', icon: ShoppingCart },
  { id: 'manifest', title: 'Manifes', icon: FileText },
  { id: 'operations', title: 'Operasional', icon: Truck },
];

const websiteItems = [
  { id: 'schedules', title: 'Jadwal', icon: Calendar },
  { id: 'fleet', title: 'Armada', icon: Truck },
  { id: 'content', title: 'Konten', icon: LayoutGrid },
  { id: 'videos', title: 'Video', icon: Play },
];

const reportItems = [
  { id: 'analytics', title: 'Analisa Data', icon: BarChart3 },
  { id: 'report-finance', title: 'Laporan Keuangan', icon: CircleDollarSign },
  { id: 'report-passengers', title: 'Laporan Penumpang', icon: Users },
];

const systemItems = [
  { id: 'database', title: 'Database', icon: Database },
  { id: 'admin-users', title: 'Kelola Admin', icon: Settings },
];

const AdminSidebar = ({ activeTab, onTabChange, isSuperAdmin = false }: AdminSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isManagementActive = managementItems.some(item => item.id === activeTab);
  const isWebsiteActive = websiteItems.some(item => item.id === activeTab);
  const isReportActive = reportItems.some(item => item.id === activeTab);
  const isSystemActive = systemItems.some(item => item.id === activeTab);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary/50 bg-white p-0.5 shadow-sm">
            <img src={logo44Trans} alt="44 Trans" className="w-full h-full object-contain rounded-full" />
          </div>
          {!isCollapsed && (
            <h2 className="font-semibold text-foreground text-sm">44 TRANS JAWA BALI</h2>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Manajemen Group */}
        <Collapsible defaultOpen={isManagementActive} className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  {!isCollapsed && <span>Manajemen</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.id)}
                        isActive={activeTab === item.id}
                        tooltip={item.title}
                        className={cn(
                          "w-full justify-start",
                          activeTab === item.id && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Manajemen Website Group */}
        <Collapsible defaultOpen={isWebsiteActive} className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {!isCollapsed && <span>Manajemen Website</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {websiteItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.id)}
                        isActive={activeTab === item.id}
                        tooltip={item.title}
                        className={cn(
                          "w-full justify-start",
                          activeTab === item.id && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Laporan Group */}
        <Collapsible defaultOpen={isReportActive} className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  {!isCollapsed && <span>Laporan</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {reportItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.id)}
                        isActive={activeTab === item.id}
                        tooltip={item.title}
                        className={cn(
                          "w-full justify-start",
                          activeTab === item.id && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* System Group - Only for Super Admin */}
        {isSuperAdmin && (
          <Collapsible defaultOpen={isSystemActive} className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {!isCollapsed && <span>Sistem</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {systemItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => onTabChange(item.id)}
                          isActive={activeTab === item.id}
                          tooltip={item.title}
                          className={cn(
                            "w-full justify-start",
                            activeTab === item.id && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
