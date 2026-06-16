import {type FormEvent, type JSX, useState} from "react";
import {useNavigate} from "react-router";
import {type Hotkey} from "@tanstack/react-hotkeys";
import {useShallow} from "zustand/react/shallow";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";
import Field from "../../components/Field/Field.tsx";
import FileField from "../../components/FileField/FileField.tsx";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";
import HintBar from "../../components/HintBar/HintBar.tsx";
import Avatar from "../../components/Avatar/Avatar.tsx";
import {UpdateCurrentUserProfileBody} from "../../api/endpoints/user/user.zod.ts";
import {UpdateCurrentUserProfileBodyStatus} from "../../api/models";
import type {UpdateCurrentUserProfileBodyStatus as Status} from "../../api/models";
import {useDeleteAccount, useUpdateProfile} from "../../data/user.ts";
import {useLogout} from "../../data/auth.ts";
import useUserStore from "../../store/useUserStore.ts";
import useModalStore from "../../store/useModalStore.ts";
import styles from "./ProfileSettingsPage.module.css";

const STATUS_VALUES = Object.values(UpdateCurrentUserProfileBodyStatus);

/**
 * Profile settings screen (`/settings`). Edits name, surname, email, avatar and
 * presence status. Status changes are sent independently of the main form (see
 * {@link applyStatus}). Also exposes account deletion and logout.
 */
function ProfileSettingsPage(): JSX.Element {
  const navigate = useNavigate();
  const user = useUserStore(useShallow((state) => state.user));
  const openModal = useModalStore(useShallow((state) => state.openModal));

  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const logout = useLogout();

  const [name, setName] = useState(user?.name ?? "");
  const [surname, setSurname] = useState(user?.surname ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [status, setStatus] = useState<Status>(user?.status ?? UpdateCurrentUserProfileBodyStatus.online);
  const [avatar, setAvatar] = useState<File | null>(null);

  // Status is its own request: the backend's PATCH /users/me still requires
  // name/surname/email, so we send the saved identity plus the new status —
  // independent of unsaved edits to the other fields.
  function applyStatus(value: Status) {
    if (!user) return;
    setStatus(value);
    updateProfile.mutate(
      {name: user.name, surname: user.surname, email: user.email, status: value},
      {onError: () => openModal({content: "Could not update status."})},
    );
  }

  function pickStatus() {
    openModal({
      content: "Set your status",
      options: STATUS_VALUES.map((value, index) => ({
        label: value,
        hotkey: String(index + 1) as Hotkey,
        function: () => applyStatus(value),
      })),
    });
  }

  function save(event?: FormEvent) {
    event?.preventDefault();
    if (updateProfile.isPending) return;

    const parsed = UpdateCurrentUserProfileBody.safeParse({
      name,
      surname,
      email,
      status,
      avatar: avatar ?? undefined,
    });
    if (!parsed.success) {
      openModal({content: "Please complete every field."});
      return;
    }

    updateProfile.mutate(parsed.data, {
      onSuccess: () => {
        setAvatar(null);
        openModal({content: "Profile updated."});
      },
      onError: () => openModal({content: "Could not update your profile."}),
    });
  }

  function confirmDelete() {
    openModal({
      content: "Delete your account permanently? This cannot be undone.",
      options: [
        {
          label: "Delete forever",
          hotkey: "D",
          function: () =>
            deleteAccount.mutate(undefined, {
              onSuccess: () => navigate("/auth/login"),
              onError: () => openModal({content: "Could not delete the account."}),
            }),
        },
        {label: "Cancel", hotkey: "C", function: () => undefined},
      ],
    });
  }

  if (!user) {
    return <AnimatedMain><p className="muted">Not signed in.</p></AnimatedMain>;
  }

  return (
    <AnimatedMain className={styles.page}>
      <div className={styles.heading}>
        <Avatar user={{...user, name, surname, status}} size={56}/>
        <h2>Your profile</h2>
      </div>

      <form className="form" onSubmit={save}>
        <Field label="Name" hotkeyKey="N" value={name} onChange={setName}/>
        <Field label="Surname" hotkeyKey="S" value={surname} onChange={setSurname}/>
        <Field label="Email" hotkeyKey="E" type="email" value={email} onChange={setEmail}/>
        <div className={styles.statusRow}>
          <InlineHotkey hotkeyFunction={pickStatus} hotkeyKey="T">Status</InlineHotkey>
          <span className={styles.statusValue}>
            <span className={styles.dot} style={{backgroundColor: `var(--status-${status})`}}/>
            {status}
          </span>
        </div>
        <FileField label="Avatar" hotkeyKey="A" file={avatar} onChange={setAvatar}/>
        <InlineHotkey hotkeyFunction={save} hotkeyKey="U" className="submit" isBlocked={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving..." : "Update profile"}
        </InlineHotkey>
      </form>

      <HintBar>
        <InlineHotkey hotkeyFunction={() => navigate("/workspaces")} hotkeyKey="W">Workspaces</InlineHotkey>
        <InlineHotkey hotkeyFunction={confirmDelete} hotkeyKey="D">Delete account</InlineHotkey>
        <InlineHotkey hotkeyFunction={() => logout.mutate(undefined, {onSettled: () => navigate("/auth/login")})} hotkeyKey="Q">Quit</InlineHotkey>
      </HintBar>
    </AnimatedMain>
  );
}

export default ProfileSettingsPage;
