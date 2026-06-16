import {type JSX, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useWorkspace} from "../../layouts/workspaceContext.ts";
import {
  useCreateIncomingWebhook,
  useCreateOutgoingWebhook,
  useDeleteIncomingWebhook,
  useDeleteOutgoingWebhook,
  useIncomingWebhooks,
  useOutgoingWebhooks,
} from "../../data/webhooks.ts";
import {
  CreateOutgoingWebhookBodyFormat,
  type CreateOutgoingWebhookBodyEventsItem,
} from "../../api/models";
import useModalStore from "../../store/useModalStore.ts";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from "./WebhooksSection.module.css";

const EVENTS: CreateOutgoingWebhookBodyEventsItem[] = [
  "message.created",
  "channel.created",
  "member.added",
];

/**
 * Workspace webhook management (admin only). Lets owners/admins mint incoming
 * webhooks (a token URL that posts external messages into a channel) and
 * register outgoing webhooks that notify an external URL — native (signed
 * JSON), Slack or Discord — on the selected workspace events.
 */
function WebhooksSection(): JSX.Element {
  const {workspace} = useWorkspace();
  const openModal = useModalStore(useShallow((state) => state.openModal));

  const incoming = useIncomingWebhooks(workspace.id);
  const outgoing = useOutgoingWebhooks(workspace.id);
  const createIncoming = useCreateIncomingWebhook();
  const deleteIncoming = useDeleteIncomingWebhook();
  const createOutgoing = useCreateOutgoingWebhook();
  const deleteOutgoing = useDeleteOutgoingWebhook();

  const [inName, setInName] = useState("");
  const [inChannel, setInChannel] = useState(workspace.channels[0]?.id ?? "");
  const [outName, setOutName] = useState("");
  const [outUrl, setOutUrl] = useState("");
  const [outFormat, setOutFormat] = useState<CreateOutgoingWebhookBodyFormat>(CreateOutgoingWebhookBodyFormat.native);
  const [outEvents, setOutEvents] = useState<CreateOutgoingWebhookBodyEventsItem[]>(["message.created"]);

  const channelName = (id: string) =>
    workspace.channels.find((c) => c.id === id)?.name ?? "?";

  const copy = (path: string) => {
    void navigator.clipboard?.writeText(`${window.location.origin}${path}`);
    openModal({content: "Webhook URL copied to clipboard."});
  };

  const addIncoming = () => {
    if (!inName.trim() || !inChannel || createIncoming.isPending) return;
    createIncoming.mutate(
      {workspaceId: workspace.id, channelId: inChannel, name: inName.trim()},
      {
        onSuccess: () => setInName(""),
        onError: () => openModal({content: "Could not create the webhook."}),
      },
    );
  };

  const toggleEvent = (event: CreateOutgoingWebhookBodyEventsItem) =>
    setOutEvents((current) =>
      current.includes(event) ? current.filter((e) => e !== event) : [...current, event],
    );

  const addOutgoing = () => {
    if (!outName.trim() || !outUrl.trim() || outEvents.length === 0 || createOutgoing.isPending) return;
    createOutgoing.mutate(
      {workspaceId: workspace.id, body: {name: outName.trim(), url: outUrl.trim(), format: outFormat, events: outEvents}},
      {
        onSuccess: (hook) => {
          setOutName("");
          setOutUrl("");
          openModal({
            content: hook.secret
              ? `Webhook created. Signing secret (shown once): ${hook.secret}`
              : "Webhook created.",
          });
        },
        onError: () => openModal({content: "Could not create the webhook. Check the URL."}),
      },
    );
  };

  const confirmDelete = (kind: "in" | "out", id: string, name: string) => {
    openModal({
      content: `Delete webhook “${name}”?`,
      options: [
        {
          label: "Delete",
          hotkey: "D",
          function: () =>
            kind === "in"
              ? deleteIncoming.mutate({workspaceId: workspace.id, webhookId: id})
              : deleteOutgoing.mutate({workspaceId: workspace.id, webhookId: id}),
        },
        {label: "Cancel", hotkey: "C", function: () => undefined},
      ],
    });
  };

  return (
    <>
      <section className={styles.section}>
        <h3>Incoming webhooks</h3>
        <p className="muted">A token URL external services POST <code>{`{ "text": "…" }`}</code> to, posting a message into the chosen channel.</p>

        <div className={styles.list}>
          {incoming.data?.length === 0 && <p className="muted">None yet.</p>}
          {incoming.data?.map((hook) => (
            <div key={hook.id} className={styles.row}>
              <span className={styles.name}>{hook.name}</span>
              <span className="muted">#{channelName(hook.channelId)}</span>
              <code className={styles.url}>{hook.url}</code>
              <span className={styles.rowActions}>
                <button type="button" onClick={() => copy(hook.url)}>Copy</button>
                <button type="button" className="danger" onClick={() => confirmDelete("in", hook.id, hook.name)}>Delete</button>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.form}>
          <input value={inName} placeholder="webhook name" onChange={(e) => setInName(e.target.value)}/>
          <select value={inChannel} onChange={(e) => setInChannel(e.target.value)}>
            {workspace.channels.map((channel) => (
              <option key={channel.id} value={channel.id}>#{channel.name}</option>
            ))}
          </select>
          <InlineHotkey hotkeyFunction={addIncoming} hotkeyKey="I" isBlocked={createIncoming.isPending}>Add incoming</InlineHotkey>
        </div>
      </section>

      <section className={styles.section}>
        <h3>Outgoing webhooks</h3>
        <p className="muted">POST to an external URL on workspace events. <strong>native</strong> sends signed JSON; <strong>slack</strong>/<strong>discord</strong> send a text payload those apps render.</p>

        <div className={styles.list}>
          {outgoing.data?.length === 0 && <p className="muted">None yet.</p>}
          {outgoing.data?.map((hook) => (
            <div key={hook.id} className={styles.row}>
              <span className={styles.name}>{hook.name}</span>
              <span className={styles.badge}>{hook.format}</span>
              <code className={styles.url}>{hook.url}</code>
              <span className="muted">{hook.events.join(", ")}</span>
              <span className={styles.rowActions}>
                <button type="button" className="danger" onClick={() => confirmDelete("out", hook.id, hook.name)}>Delete</button>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.form}>
          <input value={outName} placeholder="webhook name" onChange={(e) => setOutName(e.target.value)}/>
          <input value={outUrl} placeholder="https://…" onChange={(e) => setOutUrl(e.target.value)}/>
          <select value={outFormat} onChange={(e) => setOutFormat(e.target.value as CreateOutgoingWebhookBodyFormat)}>
            {Object.values(CreateOutgoingWebhookBodyFormat).map((fmt) => (
              <option key={fmt} value={fmt}>{fmt}</option>
            ))}
          </select>
          <span className={styles.events}>
            {EVENTS.map((event) => (
              <label key={event} className={styles.event}>
                <input type="checkbox" checked={outEvents.includes(event)} onChange={() => toggleEvent(event)}/>
                {event}
              </label>
            ))}
          </span>
          <InlineHotkey hotkeyFunction={addOutgoing} hotkeyKey="O" isBlocked={createOutgoing.isPending}>Add outgoing</InlineHotkey>
        </div>
      </section>
    </>
  );
}

export default WebhooksSection;
