import {type JSX} from "react";
import {useParams} from "react-router";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import {useDirectChats} from "../../data/messaging.ts";
import {useIsOnline} from "../../realtime/useRealtime.ts";
import Conversation from "../../components/Conversation/Conversation.tsx";
import EmptyState from "../../components/EmptyState/EmptyState.tsx";
import Loader from "../../components/Loader/Loader.tsx";

/**
 * Route screen for `dms/:directChatId`. Loads the workspace's direct chats,
 * finds the one in the URL and renders it as a {@link Conversation} (the
 * partner's name as title, their status as subtitle). Shows a loader while
 * fetching and an {@link EmptyState} when not found.
 */
function DirectChatPage(): JSX.Element {
  const {workspace} = useWorkspace();
  const {directChatId} = useParams();
  const {data: directChats, isLoading} = useDirectChats(workspace.id);

  const chat = directChats?.find((item) => item.id === directChatId);
  const online = useIsOnline(chat?.participant.id);

  if (isLoading) {
    return <EmptyState title="" hint={<Loader label="loading conversation"/>}/>;
  }

  if (!directChatId || !chat) {
    return <EmptyState title="Conversation not found"/>;
  }

  const participant = chat.participant;

  return (
    <Conversation
      key={directChatId}
      conversation={{kind: "dm", workspaceId: workspace.id, directChatId}}
      title={`${participant.name} ${participant.surname}`}
      subtitle={online ? "online" : participant.status}
    />
  );
}

export default DirectChatPage;
