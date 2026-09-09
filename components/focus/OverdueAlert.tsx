"use client";

import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { isBefore, startOfDay } from "date-fns";
import Link from "next/link";

export function OverdueAlert() {
  const { tasks } = useTasks();
  
  const today = startOfDay(new Date());
  
  const overdueTasks = tasks.filter(t => 
    t.status !== 'done' && 
    t.dueDate && 
    isBefore(startOfDay(new Date(t.dueDate)), today)
  );

  if (overdueTasks.length === 0) return null;

  return (
    <div className="w-full max-w-[560px] mx-auto mb-6">
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-red-400 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          <span>{overdueTasks.length} gecikmiş göreviniz var.</span>
        </div>
        <Link 
          href="/tasks?filter=overdue" 
          className="text-xs text-red-400 font-semibold hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          Görüntüle <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
