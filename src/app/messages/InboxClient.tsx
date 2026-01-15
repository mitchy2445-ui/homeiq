"use client";

import ConversationRow from "./ConversationRow";

type InboxItem = {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: Date | string | null;
  unread: boolean;
};

export default function InboxClient({
  conversations,
}: {
  conversations: InboxItem[];
}) {
  if (conversations.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-24">
        <p className="text-sm">
          You don’t have any conversations yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-2xl border bg-white">
      {conversations.map((c) => (
        <ConversationRow
          key={c.id}
          id={c.id}
          title={c.title}
          lastMessage={c.lastMessage}
          lastMessageAt={c.lastMessageAt}
          unread={c.unread}
        />
      ))}
    </ul>
  );
}
