import {type JSX, useState} from "react";
import type {User} from "../../api/models";
import {resolveAssetUrl} from "../../config/api.ts";
import styles from "./Avatar.module.css";

interface AvatarProps {
  user: User;
  size?: number;
  showStatus?: boolean;
}

function initials(user: User): string {
  return `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase() || "?";
}

function Avatar({user, size = 36, showStatus = true}: AvatarProps): JSX.Element {
  const [broken, setBroken] = useState(false);
  const showImage = user.avatarUrl && !broken;

  return (
    <span
      className={styles.avatar}
      style={{width: size, height: size, fontSize: size * 0.4}}
      title={`${user.name} ${user.surname} — ${user.status}`}
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
