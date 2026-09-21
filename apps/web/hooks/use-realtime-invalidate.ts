"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Subscribes to Supabase Realtime changes on a table and
 * invalidates React Query keys whenever a change is detected.
 */
export function useRealtimeInvalidate(
  table: string,
  queryKeys: (string | null | undefined)[][],
  _events: string[] = ["*"],
  filter?: string
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelName = `rt-${table}-${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}