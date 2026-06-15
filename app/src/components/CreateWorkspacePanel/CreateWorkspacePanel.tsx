import {type FormEvent, type JSX, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {CreateWorkspaceBody} from "../../api/endpoints/workspace/workspace.zod.ts";
import {useAcceptWorkspacePayment, useCreateWorkspace} from "../../data/workspaces.ts";
import useModalStore from "../../store/useModalStore.ts";
import Field from "../Field/Field.tsx";
import FileField from "../FileField/FileField.tsx";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import StripePaymentForm from "../StripePaymentForm/StripePaymentForm.tsx";
import styles from "./CreateWorkspacePanel.module.css";

interface CreateWorkspacePanelProps {
  onDone: () => void;
  onCancel: () => void;
}

// Two-step workspace creation: name the workspace (which returns a Stripe
// client secret), then pay to confirm. Payment confirmation is reported back
// to the API via accept-payment before the workspace becomes usable.
function CreateWorkspacePanel({onDone, onCancel}: CreateWorkspacePanelProps): JSX.Element {
  const openModal = useModalStore(useShallow((state) => state.openModal));
  const createWorkspace = useCreateWorkspace();
  const acceptPayment = useAcceptWorkspacePayment();

  const [name, setName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  function submitForm(event?: FormEvent) {
    event?.preventDefault();
    if (createWorkspace.isPending) return;

    const parsed = CreateWorkspaceBody.safeParse({
      workspaceName: name,
      workspaceLogo: logo ?? undefined,
    });
    if (!parsed.success) {
      openModal({content: "Enter a workspace name."});
      return;
    }

    createWorkspace.mutate(parsed.data, {
      onSuccess: (secret) => setClientSecret(secret),
      onError: () => openModal({content: "Could not start workspace creation."}),
    });
  }

  function onPaid(paymentIntentId: string) {
    acceptPayment.mutate(
      {paymentIntentId},
      {
        onSuccess: () =>
          openModal({content: "Workspace created!", onClose: onDone}),
        onError: () =>
          openModal({content: "Payment confirmation failed. Please try again."}),
      },
    );
  }

  return (
    <div className={styles.panel}>
      <h3>New workspace</h3>
      {clientSecret === null ? (
        <form className={styles.form} onSubmit={submitForm}>
          <Field label="Name" hotkeyKey="N" value={name} onChange={setName}/>
          <FileField label="Logo" hotkeyKey="L" file={logo} onChange={setLogo}/>
          <div className={styles.actions}>
            <InlineHotkey hotkeyFunction={submitForm} hotkeyKey="C" isBlocked={createWorkspace.isPending}>
              {createWorkspace.isPending ? "Preparing..." : "Continue to payment"}
            </InlineHotkey>
            <InlineHotkey hotkeyFunction={onCancel} hotkeyKey="X">Cancel</InlineHotkey>
          </div>
        </form>
      ) : (
        <div className={styles.form}>
          <p className="muted">Complete payment to finish creating <span className="primary">{name}</span>.</p>
          <StripePaymentForm
            clientSecret={clientSecret}
            onPaid={onPaid}
            accepting={acceptPayment.isPending}
          />
          <InlineHotkey hotkeyFunction={onCancel} hotkeyKey="X">Cancel</InlineHotkey>
        </div>
      )}
    </div>
  );
}

export default CreateWorkspacePanel;
