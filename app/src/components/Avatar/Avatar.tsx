import {type JSX, useState} from "react";
import type {User} from "../../api/models";
import {resolveAssetUrl} from "../../config/api.ts";
import styles from "./Avatar.module.css";

/** Props for {@link Avatar}. */
interface AvatarProps {
  /** User whose avatar/initials/status are shown. */
  user: User;
  /** Square size in pixels. Defaults to 36. */
  size?: number;
  /** Whether to render the presence-status dot. Defaults to true. */
  showStatus?: boolean;
  /**
   * Live connection state from the realtime layer. When `true`, a green ring
   * marks the user as online; `undefined` leaves the ring off (state unknown).
   */
  online?: boolean;
}

/** Build the uppercase initials fallback (first letters of name + surname). */
function initials(user: User): string {
  return `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase() || "?";
}

/**
 * Circular user avatar. Shows the avatar image when available, falling back to
 * initials if there is no URL or the image fails to load. An optional colored
 * dot reflects the user's presence status, and an optional green ring marks a
 * user the realtime layer reports as online.
 */
function Avatar({user, size = 36, showStatus = true, online}: AvatarProps): JSX.Element {
  const [broken, setBroken] = useState(false);
  const showImage = user.avatarUrl && !broken;

  return (
    <span
      className={`${styles.avatar} ${online ? styles.online : ""}`}
      style={{width: size, height: size, fontSize: size * 0.4}}
      title={`${user.name} ${user.surname} — ${user.status}${online ? " (online)" : ""}`}
    >
      {showImage ? (
        <img src={resolveAssetUrl(user.avatarUrl)} alt="" onError={() => setBroken(true)}/>
      ) : (
        <span aria-hidden>{initials(user)}</span>
      )}
      {showStatus && (
        <span
          className={styles.status}
          style={{backgroundColor: `var(--status-${user.status})`}}
        />
      )}
    </span>
  );
}

export default Avatar;
