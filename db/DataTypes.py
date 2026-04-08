import enum


class UserStatus(enum.Enum):
    online = "online"
    meeting = "meeting"
    vacations = "vacations"
    notDisturb = "notDisturb"
    workAtHome = "workAtHome"
    freeTime = "freeTime"
    offline = "offline"


class WorkspaceUserRole(enum.Enum):
    owner = "owner"
    admin = "admin"
    member = "member"
