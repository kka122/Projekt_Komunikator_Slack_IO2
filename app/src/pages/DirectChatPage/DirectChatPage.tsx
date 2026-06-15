import {type JSX} from "react";
import {useParams} from "react-router";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import {useDirectChats} from "../../data/messaging.ts";
import Conversation from "../../components/Conversation/Conversation.tsx";
import EmptyState from "../../components/EmptyState/EmptyState.tsx";
import Loader from "../../components/Loader/Loader.tsx";

function DirectChatPage(): JSX.Element {
  const {workspace} = useWorkspace();
  const {directChatId} = useParams();
  const {data: directChats, isLoading} = useDirectChats(workspace.id);

  const chat = directChats?.find((item) => item.id === directChatId);

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
      subtitle={participant.status}
    />
  );
}

export default DirectChatPage;
