import {type JSX} from "react";
import {useParams} from "react-router";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import Conversation from "../../components/Conversation/Conversation.tsx";
import EmptyState from "../../components/EmptyState/EmptyState.tsx";

function ChannelPage(): JSX.Element {
  const {workspace} = useWorkspace();
  const {channelId} = useParams();
  const channel = workspace.channels.find((item) => item.id === channelId);

  if (!channelId || !channel) {
    return <EmptyState title="Channel not found" hint="It may have been deleted."/>;
  }

  return (
    <Conversation
      key={channelId}
      conversation={{kind: "channel", workspaceId: workspace.id, channelId}}
      title={`#${channel.name}`}
    />
  );
}

export default ChannelPage;
