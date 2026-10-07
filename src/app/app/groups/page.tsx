"use client";

import { ChevronRight } from "lucide-react";
import { PageHeader, useApp } from "@/components/app/AppShell";
import { ButtonLink, EmptyState, List, ListRow, Pill } from "@/components/ui";
import { groupNets, myGroups } from "@/lib/demo/logic";
import { formatMoney } from "@/lib/ledger";

export default function GroupsPage() {
  const { state, me } = useApp();
  const groups = myGroups(state, me.id);
  return (
    <main>
      <PageHeader title="Groups" />
      <div className="mb-4 grid grid-cols-2 gap-2">
        <ButtonLink href="/app/groups/new" variant="primary">
          Create group
        </ButtonLink>
        <ButtonLink href="/app/groups/join">Join by code</ButtonLink>
      </div>
      {groups.length ? (
        <List>
          {groups.map((g) => {
            const net = groupNets(state, g).get(me.id) ?? 0;
            return (
              <ListRow
                key={g.id}
                href={`/app/groups/${g.id}`}
                left={
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg text-[22px]" aria-hidden>
                    {g.icon}
                  </span>
                }
                title={
                  <span className="flex items-center gap-2">
                    {g.name} {g.isTrip ? <Pill tone="info">Trip</Pill> : null}
                  </span>
                }
                subtitle={`${g.members.length} members · ${g.currency}`}
                right={
                  <span className="flex items-center gap-2">
                    <span className="text-right">
                      {net === 0 ? (
                        <span className="text-[13px] text-muted">settled up</span>
                      ) : (
                        <>
                          <span className={`tabular block text-[15px] font-semibold ${net > 0 ? "text-success-text" : "text-danger-text"}`}>
                            {formatMoney(net, g.currency, { sign: true })}
                          </span>
                          <span className="block text-[12px] text-muted">{net > 0 ? "owed to you" : "you owe"}</span>
                        </>
                      )}
                    </span>
                    <ChevronRight size={18} className="text-muted" aria-hidden />
                  </span>
                }
              />
            );
          })}
        </List>
      ) : (
        <EmptyState text="You're not in any groups yet." action={<ButtonLink href="/app/groups/join">Join with a code</ButtonLink>} />
      )}
    </main>
  );
}
