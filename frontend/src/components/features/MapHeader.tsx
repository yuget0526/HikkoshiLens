"use client";

import * as React from "react";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { HeaderRow } from "@/components/layout/HeaderRow";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type MapHeaderCrumb = {
  label: string;
  href?: string;
  current?: boolean;
};
export interface MapHeaderProps {
  title?: string;
  items?: MapHeaderCrumb[];
  showBack?: boolean;
  onBack?: () => void;
}

export function MapHeader({ title, items }: MapHeaderProps) {
  // sidebar toggle
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen);

  return (
    <div className="w-full bg-background h-14 fixed top-16 z-10">
      <HeaderRow
        left={
          <div className="flex items-center space-x-6">
            {/* Back + Title/Breadcrumbs */}
            <div className="flex items-center space-x-3">
              {(title || (items && items.length > 0)) && (
                <div className="flex flex-row gap-4">
                  {items && items.length > 0 && (
                    <Breadcrumb>
                      <BreadcrumbList>
                        {items.map((it, i) => (
                          <React.Fragment key={i}>
                            <BreadcrumbItem>
                              {it.current || !it.href ? (
                                <BreadcrumbPage>{it.label}</BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink href={it.href}>
                                  {it.label}
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                            {i < items.length - 1 && <BreadcrumbSeparator />}
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>
                  )}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-border hidden md:block" />
          </div>
        }
        right={
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-4">
            {/* <MapSearchBox /> */}
            <button
              onClick={() => toggleSidebar()}
              aria-expanded={isSidebarOpen}
              className="p-2 rounded-md bg-background shadow-sm border"
            >
              {isSidebarOpen ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </button>
          </div>
        }
      />
    </div>
  );
}
