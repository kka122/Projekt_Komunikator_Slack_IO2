from sqlalchemy import create_engine, Column, Integer, String, Text, text, Enum, DateTime, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.orm import declarative_base, relationship, Session
from db.DataTypes import WorkspaceUserRole, UserStatus
from datetime import datetime
from sqlalchemy.exc import IntegrityError
import bcrypt

Base = declarative_base()


class WorkSpaceUser(Base):
    __tablename__ = "workspace_user"
    workspaceId = Column(Integer, ForeignKey('workspace.id'), primary_key=True)
    userId = Column(Integer, ForeignKey("user.id"), primary_key=True)
    role = Column(Enum(WorkspaceUserRole), nullable=False)

    workspace = relationship("Workspace", back_populates="workspace_users")
    user = relationship("User", back_populates="workspace_users")


class User(Base):
    __tablename__ = "user"
    __table_args__ = (
        CheckConstraint(
            "(\"googleId\" IS NOT NULL AND (password IS NULL OR password = '')) OR "
            "(\"googleId\" IS NULL AND password IS NOT NULL AND password <> '')",
            name="ck_user_password_xor_googleid",
        ),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=True)
    googleId = Column(String, nullable=True, unique=True)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.offline)
    avatarUrl = Column(String, nullable=False, default="")
    createAt = Column(DateTime, default=datetime.now)

    workspace_users = relationship("WorkSpaceUser", back_populates="user", cascade="all, delete-orphan")
    channels = relationship("ChannelUser", back_populates="user")
    messages = relationship("Message", back_populates="user")
    reactions = relationship("Reaction", back_populates="user")
    attachments = relationship("Attachment", back_populates="user")
    direct_chats_as_user1 = relationship("DirectChat", foreign_keys="DirectChat.user1Id", back_populates="user1")
    direct_chats_as_user2 = relationship("DirectChat", foreign_keys="DirectChat.user2Id", back_populates="user2")


class Workspace(Base):
    __tablename__ = "workspace"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    logoUrl = Column(String, nullable=False)
    stripePaymentIntentId = Column(String, unique=True)

    workspace_users = relationship("WorkSpaceUser", back_populates="workspace", cascade="all, delete-orphan")
    channels = relationship("Channel", back_populates="workspace")
    messages = relationship("Message", back_populates="workspace")
    direct_chats = relationship("DirectChat", back_populates="workspace")


class Channel(Base):
    __tablename__ = "channel"
    id = Column(Integer, primary_key=True)
    workspaceId = Column(Integer, ForeignKey('workspace.id'), nullable=False)
    name = Column(String, nullable=False)

    workspace = relationship("Workspace", back_populates="channels")
    users = relationship("ChannelUser", back_populates="channel")
    messages = relationship("Message", back_populates="channel")


class ChannelUser(Base):
    __tablename__ = "channel_user"
    channelId = Column(Integer, ForeignKey('channel.id'), primary_key=True)
    userId = Column(Integer, ForeignKey('user.id'), primary_key=True)
    lastReadAt = Column(DateTime)

    user = relationship("User", back_populates="channels")
    channel = relationship("Channel", back_populates="users")


class Message(Base):
    __tablename__ = "message"
    id = Column(Integer, primary_key=True)
    workspaceId = Column(Integer, ForeignKey('workspace.id'), nullable=False)
    channelId = Column(Integer, ForeignKey('channel.id'), nullable=True)
    directChatId = Column(Integer, ForeignKey('direct_chat.id'), nullable=True)
    parentMessageId = Column(Integer, ForeignKey('message.id'))
    authorId = Column(Integer, ForeignKey('user.id'), nullable=False)
    body = Column(Text, nullable=False)
    isEdited = Column(Boolean, nullable=False, default=False)
    isDeleted = Column(Boolean, nullable=False, default=False)
    createAt = Column(DateTime, default=datetime.now)

    parent = relationship("Message", remote_side=[id], back_populates="children")
    children = relationship("Message", back_populates="parent")
    reactions = relationship("Reaction", back_populates="message")
    attachments = relationship("Attachment", back_populates="message")
    user = relationship("User", back_populates="messages")
    workspace = relationship("Workspace", back_populates="messages")
    channel = relationship("Channel", back_populates="messages")
    direct_chat = relationship("DirectChat", back_populates="messages")


class Reaction(Base):
    __tablename__ = "reaction"
    id = Column(Integer, primary_key=True)
    messageId = Column(Integer, ForeignKey('message.id'), nullable=False)
    userId = Column(Integer, ForeignKey('user.id'), nullable=False)
    emoji = Column(String, nullable=False)

    user = relationship("User", back_populates="reactions")
    message = relationship("Message", back_populates="reactions")


class Attachment(Base):
    __tablename__ = "attachment"
    id = Column(Integer, primary_key=True)
    messageId = Column(Integer, ForeignKey('message.id'), nullable=False)
    userId = Column(Integer, ForeignKey('user.id'), nullable=False)
    fileName = Column(String, nullable=False)
    fileUrl = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)

    user = relationship("User", back_populates="attachments")
    message = relationship("Message", back_populates="attachments")


class DirectChat(Base):
    __tablename__ = "direct_chat"
    id = Column(Integer, primary_key=True)
    workspaceId = Column(Integer, ForeignKey("workspace.id"), nullable=False)
    user1Id = Column(Integer, ForeignKey("user.id"), nullable=False)
    user2Id = Column(Integer, ForeignKey("user.id"), nullable=False)
    createAt = Column(DateTime, default=datetime.now)

    workspace = relationship("Workspace", back_populates="direct_chats")
    user1 = relationship("User", foreign_keys=[user1Id], back_populates="direct_chats_as_user1")
    user2 = relationship("User", foreign_keys=[user2Id], back_populates="direct_chats_as_user2")
    messages = relationship("Message", back_populates="direct_chat")
    reads = relationship("DirectChatUser", back_populates="direct_chat", cascade="all, delete-orphan")


class DirectChatUser(Base):
    __tablename__ = "direct_chat_user"
    directChatId = Column(Integer, ForeignKey('direct_chat.id'), primary_key=True)
    userId = Column(Integer, ForeignKey('user.id'), primary_key=True)
    lastReadAt = Column(DateTime)

    direct_chat = relationship("DirectChat", back_populates="reads")
    user = relationship("User")


class Setup:
    def __init__(self, *, HOST="localhost", PORT=6000, BASE_NAME="baza_danych", USER="postgres", PASSWORD="1234"):
        self.HOST = HOST
        self.PORT = PORT
        self.BASE_NAME = BASE_NAME
        self.USER = USER
        self.PASSWORD = PASSWORD
        self.SETUP_DATABASE_URI = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/postgres"
        self.APP_DATABASE_URI = f"postgresql+psycopg2://{self.USER}:{self.PASSWORD}@{self.HOST}:{self.PORT}/{self.BASE_NAME}"
        self.app_engine = None

    def _createDataBase(self):
        set_engine = create_engine(self.SETUP_DATABASE_URI, isolation_level="AUTOCOMMIT")

        with set_engine.connect() as conn:
            result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": self.BASE_NAME})
            exists = result.scalar() is not None
            if not exists:
                conn.execute(text(f"CREATE DATABASE {self.BASE_NAME}"))
                print("Baza została utworzona")
            else:
                print("Baza już istnieje")

    def _dataBaseConnection(self):
        self.app_engine = create_engine(self.APP_DATABASE_URI)
        print(f"Połączono z bazą danych: {self.BASE_NAME}")

    def _createTables(self):
        if self.app_engine is None:
            self._createDataBase()
            self._dataBaseConnection()

        Base.metadata.create_all(self.app_engine)
        self.app_engine.dispose()

    def initialize(self):
        self._createTables()

    ################################################################################################################
    #                                             USER  METHODS                                                    #
    ################################################################################################################

    @staticmethod
    def _hashPassword(password):
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def _verifyPassword(password, hashed):
        if not hashed:
            return False
        try:
            return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
        except ValueError:
            return False

    @staticmethod
    def _coerceStatus(status):
        if status is None:
            return UserStatus.offline
        if isinstance(status, UserStatus):
            return status
        return UserStatus(status)

    def addUser(self, name, surname, email, password=None, avatarUrl="", googleId=None, status=None):
        password = password if password else None
        googleId = googleId if googleId else None
        status = self._coerceStatus(status)

        if (password is None and googleId is None) or (password is not None and googleId is not None):
            raise ValueError("Dokladnie jedno z pol: password albo googleId musi byc ustawione")

        password_hash = self._hashPassword(password) if password is not None else None

        with Session(self.app_engine) as session:
            if session.query(User).filter(User.email == email).first():
                raise ValueError("Uzytkownik z tym emailem juz istnieje")

            if googleId and session.query(User).filter(User.googleId == googleId).first():
                raise ValueError("Uzytkownik z tym googleId juz istnieje")

            new_user = User(
                name=name,
                surname=surname,
                email=email,
                password=password_hash,
                googleId=googleId,
                avatarUrl=avatarUrl,
                status=status
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            return new_user

    def checkUser(self, email, password):
        with Session(self.app_engine) as session:
            user = (
                session.query(User)
                .filter(
                    User.email == email,
                    User.googleId.is_(None)
                )
                .first()
            )
            if user is None or user.password is None:
                return False
            return self._verifyPassword(password, user.password)

    def setUserStatus(self, email, status):
        status = self._coerceStatus(status)
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == email).first()
            if user is None:
                return False
            user.status = status
            session.commit()
            return True

    def getOrCreateGoogleUser(self, googleId, email, name, surname, avatarUrl=""):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.googleId == googleId).first()
            if user:
                return user, False

            existing_email = session.query(User).filter(User.email == email).first()
            if existing_email and existing_email.googleId is None:
                raise ValueError("Email zajety przez konto haslowe")
            if existing_email and existing_email.googleId != googleId:
                raise ValueError("Email zajety przez inne konto Google")

            user = User(
                name=name,
                surname=surname,
                email=email,
                password=None,
                googleId=googleId,
                avatarUrl=avatarUrl or ""
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            return user, True

    ################################################################################################################
    #                                           CHANNEL METHODS                                                    #
    ################################################################################################################

    def addChannel(self, workspaceId, name, creatorEmail):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == creatorEmail).first()
            if not user:
                raise ValueError("Uzytkownik nie istnieje")

            new_channel = Channel(
                workspaceId=int(workspaceId),
                name=name,
            )
            session.add(new_channel)
            session.flush()
            new_membership = ChannelUser(
                channelId=new_channel.id,
                userId=user.id,
                lastReadAt=datetime.now()
            )
            session.add(new_membership)
            session.commit()
            session.refresh(new_channel)
            return new_channel

    def deleteChannel(self, workspaceId, channelId, creatorEmail):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == creatorEmail).first()
            if not user:
                raise ValueError("Uzytkownik nie istnieje")

            channel = session.query(Channel).filter(Channel.id == channelId).first()
            if not channel:
                raise ValueError("Kanał nie istnieje")

            if channel.workspaceId != int(workspaceId):
                raise ValueError("Kanał nie należy do podanego workspaceId")

            session.query(ChannelUser).filter(ChannelUser.channelId == channelId).delete()

            session.query(Message).filter(Message.channelId == channelId).delete()

            session.delete(channel)
            session.commit()

    def updateChannelName(self, workspaceId, channelId, newName, updaterEmail):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == updaterEmail).first()
            if not user:
                raise ValueError("Uzytkownik nie istnieje")

            channel = session.query(Channel).filter(Channel.id == channelId).first()
            if not channel:
                raise ValueError("Kanał nie istnieje")

            if channel.workspaceId != int(workspaceId):
                raise ValueError("Kanał nie należy do podanego workspaceId")

            if not newName.strip():
                raise ValueError("Nazwa kanału nie może być pusta")

            channel.name = newName.strip()
            session.commit()
            session.refresh(channel)
            return channel

    def listAllChannels(self, workspaceId, creatorEmail):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == creatorEmail).first()
            if not user:
                raise ValueError("Uzytkownik nie istnieje")

            rows = (
                session.query(Channel, ChannelUser.lastReadAt)
                .join(ChannelUser, Channel.id == ChannelUser.channelId)
                .filter(
                    Channel.workspaceId == int(workspaceId),
                    ChannelUser.userId == user.id
                )
                .all()
            )

            result = []
            for channel, last_read_at in rows:
                count_filter = [
                    Message.channelId == channel.id,
                    Message.authorId != user.id,
                    Message.isDeleted == False,
                ]
                if last_read_at is not None:
                    count_filter.append(Message.createAt > last_read_at)

                new_messages_count = session.query(Message).filter(*count_filter).count()

                result.append({
                    "id": str(channel.id),
                    "name": channel.name,
                    "newMessagesCount": new_messages_count,
                })

            return result

    ################################################################################################################
    #                                              WORKSPACE METHODS                                               #
    ################################################################################################################

    def getUserByEmail(self, email):
        with Session(self.app_engine) as session:
            return session.query(User).filter(User.email == email).first()

    def createWorkspace(self, name, ownerEmail, stripePaymentIntentId, logoUrl=""):
        with Session(self.app_engine) as session:
            existing = (session.query(Workspace).filter(Workspace.stripePaymentIntentId == stripePaymentIntentId).first())
            if existing:
                return existing, False

            user = session.query(User).filter(User.email == ownerEmail).first()
            if user is None:
                raise ValueError("Uzytkownik nie istnieje")

            workspace = Workspace(name=name, logoUrl=logoUrl or "", stripePaymentIntentId=stripePaymentIntentId)
            session.add(workspace)
            session.flush()

            membership = WorkSpaceUser(workspaceId=workspace.id, userId=user.id, role=WorkspaceUserRole.owner)
            session.add(membership)

            try:
                session.commit()
            except IntegrityError:
                session.rollback()
                existing = (session.query(Workspace).filter(Workspace.stripePaymentIntentId == stripePaymentIntentId).first())
                return existing, False

            session.refresh(workspace)
            return workspace, True

    def listUserWorkspaces(self, email):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == email).first()
            if not user:
                return []

            memberships = session.query(WorkSpaceUser).filter(WorkSpaceUser.userId == user.id).all()

            result = []
            for membership in memberships:
                workspace = session.query(Workspace).filter(Workspace.id == membership.workspaceId).first()
                if not workspace:
                    continue

                channel_rows = (
                    session.query(Channel, ChannelUser.lastReadAt)
                    .join(ChannelUser, Channel.id == ChannelUser.channelId)
                    .filter(Channel.workspaceId == workspace.id, ChannelUser.userId == user.id)
                    .all()
                )
                channels = []
                for channel, last_read_at in channel_rows:
                    count_filter = [
                        Message.channelId == channel.id,
                        Message.authorId != user.id,
                        Message.isDeleted == False,
                    ]
                    if last_read_at is not None:
                        count_filter.append(Message.createAt > last_read_at)
                    new_messages_count = session.query(Message).filter(*count_filter).count()
                    channels.append({
                        "id": str(channel.id),
                        "name": channel.name,
                        "newMessagesCount": new_messages_count,
                    })

                members = (
                    session.query(User)
                    .join(WorkSpaceUser, User.id == WorkSpaceUser.userId)
                    .filter(WorkSpaceUser.workspaceId == workspace.id)
                    .all()
                )

                result.append({
                    "id": str(workspace.id),
                    "name": workspace.name,
                    "logoUrl": workspace.logoUrl,
                    "userRole": membership.role.value,
                    "channels": channels,
                    "users": [self._serializeUser(m) for m in members],
                })

            return result

    def updateWorkspaceLogo(self, workspaceId, logoUrl):
        with Session(self.app_engine) as session:
            workspace = session.query(Workspace).filter(Workspace.id == workspaceId).first()
            if workspace is None:
                return False
            workspace.logoUrl = logoUrl
            session.commit()
            return True

    ################################################################################################################
    #                                              MESSAGE METHODS                                                 #
    ################################################################################################################

    @staticmethod
    def _asId(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            raise LookupError("Nieprawidłowy identyfikator")

    @staticmethod
    def _serializeUser(user):
        return {
            "id": str(user.id),
            "name": user.name,
            "surname": user.surname,
            "email": user.email,
            "avatarUrl": user.avatarUrl,
            "status": user.status.value,
        }

    @staticmethod
    def _serializeAttachment(att):
        return {
            "id": str(att.id),
            "filename": att.fileName,
            "url": att.fileUrl,
            "size": att.file_size,
        }

    @staticmethod
    def _serializeReaction(reaction):
        return {
            "id": str(reaction.id),
            "emoji": reaction.emoji,
            "user": Setup._serializeUser(reaction.user),
        }

    @staticmethod
    def _serializeMessage(message):
        return {
            "id": str(message.id),
            "content": message.body,
            "sender": Setup._serializeUser(message.user),
            "timestamp": message.createAt.isoformat() if message.createAt else None,
            "isEdited": message.isEdited,
            "attachments": [Setup._serializeAttachment(a) for a in message.attachments],
            "reactions": [Setup._serializeReaction(r) for r in message.reactions],
        }

    @staticmethod
    def _isWorkspaceAdmin(session, userId, workspaceId):
        membership = (
            session.query(WorkSpaceUser)
            .filter(WorkSpaceUser.userId == userId, WorkSpaceUser.workspaceId == workspaceId)
            .first()
        )
        return membership is not None and membership.role in (WorkspaceUserRole.owner, WorkspaceUserRole.admin)

    def _getChannelForMember(self, session, workspaceId, channelId, email):
        """Zwraca (user, channel). Rzuca LookupError/PermissionError."""
        user = session.query(User).filter(User.email == email).first()
        if not user:
            raise LookupError("Uzytkownik nie istnieje")

        channel = session.query(Channel).filter(Channel.id == self._asId(channelId)).first()
        if not channel or channel.workspaceId != self._asId(workspaceId):
            raise LookupError("Kanał nie istnieje")

        membership = (
            session.query(ChannelUser)
            .filter(ChannelUser.channelId == channel.id, ChannelUser.userId == user.id)
            .first()
        )
        if not membership:
            raise PermissionError("Użytkownik nie należy do kanału")

        return user, channel

    def _getChatForMember(self, session, workspaceId, directChatId, email):
        """Zwraca (user, chat). Rzuca LookupError/PermissionError."""
        user = session.query(User).filter(User.email == email).first()
        if not user:
            raise LookupError("Uzytkownik nie istnieje")

        chat = session.query(DirectChat).filter(DirectChat.id == self._asId(directChatId)).first()
        if not chat or chat.workspaceId != self._asId(workspaceId):
            raise LookupError("Czat nie istnieje")

        if user.id not in (chat.user1Id, chat.user2Id):
            raise PermissionError("Użytkownik nie należy do tego czatu")

        return user, chat

    @staticmethod
    def _normalizePagination(page, pageSize):
        try:
            page = int(page)
            pageSize = int(pageSize)
        except (TypeError, ValueError):
            raise ValueError("page i pageSize muszą być liczbami")
        if page < 1 or pageSize < 1 or pageSize > 50:
            raise ValueError("Nieprawidłowe parametry paginacji")
        return page, pageSize

    # ---------------------------------- CHANNEL MESSAGES ----------------------------------

    def createMessageChannel(self, workspaceId, channelId, authorEmail, content, attachments=None, parentMessageId=None):
        content = (content or "").strip()
        attachments = attachments or []
        if not attachments:
            raise ValueError("Wiadomość musi zawierać co najmniej jeden załącznik")

        with Session(self.app_engine) as session:
            user, channel = self._getChannelForMember(session, workspaceId, channelId, authorEmail)

            parent_id = None
            if parentMessageId is not None:
                parent = session.query(Message).filter(Message.id == self._asId(parentMessageId)).first()
                if not parent or parent.channelId != channel.id:
                    raise LookupError("Wiadomość nadrzędna nie istnieje")
                parent_id = parent.id

            message = Message(
                workspaceId=channel.workspaceId,
                channelId=channel.id,
                authorId=user.id,
                body=content,
                parentMessageId=parent_id,
            )
            session.add(message)
            session.flush()

            for att in attachments:
                session.add(Attachment(
                    messageId=message.id,
                    userId=user.id,
                    fileName=att["fileName"],
                    fileUrl=att["fileUrl"],
                    file_size=att["fileSize"],
                ))

            session.commit()
            session.refresh(message)
            return self._serializeMessage(message)

    def listAllMessageChannels(self, workspaceId, channelId, userEmail, page=1, pageSize=20):
        page, pageSize = self._normalizePagination(page, pageSize)
        with Session(self.app_engine) as session:
            self._getChannelForMember(session, workspaceId, channelId, userEmail)

            messages = (
                session.query(Message)
                .filter(Message.channelId == self._asId(channelId), Message.isDeleted == False)
                .order_by(Message.createAt.desc(), Message.id.desc())
                .offset((page - 1) * pageSize)
                .limit(pageSize)
                .all()
            )
            return [self._serializeMessage(m) for m in messages]

    def updateMessageChannel(self, workspaceId, channelId, messageId, content, editorEmail):
        content = (content or "").strip()
        if not content:
            raise ValueError("Treść wiadomości nie może być pusta")

        with Session(self.app_engine) as session:
            user, channel = self._getChannelForMember(session, workspaceId, channelId, editorEmail)

            message = (
                session.query(Message)
                .filter(Message.id == self._asId(messageId), Message.channelId == channel.id, Message.isDeleted == False)
                .first()
            )
            if not message:
                raise LookupError("Wiadomość nie istnieje")
            if message.authorId != user.id:
                raise PermissionError("Tylko autor może edytować wiadomość")

            message.body = content
            message.isEdited = True
            session.commit()
            session.refresh(message)
            return self._serializeMessage(message)

    def deleteMessageChannel(self, workspaceId, channelId, messageId, requesterEmail):
        with Session(self.app_engine) as session:
            user, channel = self._getChannelForMember(session, workspaceId, channelId, requesterEmail)

            message = (
                session.query(Message)
                .filter(Message.id == self._asId(messageId), Message.channelId == channel.id, Message.isDeleted == False)
                .first()
            )
            if not message:
                raise LookupError("Wiadomość nie istnieje")

            if message.authorId != user.id and not self._isWorkspaceAdmin(session, user.id, channel.workspaceId):
                raise PermissionError("Brak uprawnień do usunięcia wiadomości")

            message.isDeleted = True
            session.commit()

    # ---------------------------------- DIRECT CHAT MESSAGES ----------------------------------

    def createMessageChat(self, workspaceId, directChatId, authorEmail, content, attachments=None, parentMessageId=None):
        content = (content or "").strip()
        attachments = attachments or []
        if not attachments:
            raise ValueError("Wiadomość musi zawierać co najmniej jeden załącznik")

        with Session(self.app_engine) as session:
            user, chat = self._getChatForMember(session, workspaceId, directChatId, authorEmail)

            parent_id = None
            if parentMessageId is not None:
                parent = session.query(Message).filter(Message.id == self._asId(parentMessageId)).first()
                if not parent or parent.directChatId != chat.id:
                    raise LookupError("Wiadomość nadrzędna nie istnieje")
                parent_id = parent.id

            message = Message(
                workspaceId=chat.workspaceId,
                directChatId=chat.id,
                authorId=user.id,
                body=content,
                parentMessageId=parent_id,
            )
            session.add(message)
            session.flush()

            for att in attachments:
                session.add(Attachment(
                    messageId=message.id,
                    userId=user.id,
                    fileName=att["fileName"],
                    fileUrl=att["fileUrl"],
                    file_size=att["fileSize"],
                ))

            session.commit()
            session.refresh(message)
            return self._serializeMessage(message)

    def listAllMessageChats(self, workspaceId, directChatId, userEmail, page=1, pageSize=20):
        page, pageSize = self._normalizePagination(page, pageSize)
        with Session(self.app_engine) as session:
            self._getChatForMember(session, workspaceId, directChatId, userEmail)

            messages = (
                session.query(Message)
                .filter(Message.directChatId == self._asId(directChatId), Message.isDeleted == False)
                .order_by(Message.createAt.desc(), Message.id.desc())
                .offset((page - 1) * pageSize)
                .limit(pageSize)
                .all()
            )
            return [self._serializeMessage(m) for m in messages]

    def updateMessageChat(self, workspaceId, directChatId, messageId, content, editorEmail):
        content = (content or "").strip()
        if not content:
            raise ValueError("Treść wiadomości nie może być pusta")

        with Session(self.app_engine) as session:
            user, chat = self._getChatForMember(session, workspaceId, directChatId, editorEmail)

            message = (
                session.query(Message)
                .filter(Message.id == self._asId(messageId), Message.directChatId == chat.id, Message.isDeleted == False)
                .first()
            )
            if not message:
                raise LookupError("Wiadomość nie istnieje")
            if message.authorId != user.id:
                raise PermissionError("Tylko autor może edytować wiadomość")

            message.body = content
            message.isEdited = True
            session.commit()
            session.refresh(message)
            return self._serializeMessage(message)

    def deleteMessageChat(self, workspaceId, directChatId, messageId, requesterEmail):
        with Session(self.app_engine) as session:
            user, chat = self._getChatForMember(session, workspaceId, directChatId, requesterEmail)

            message = (
                session.query(Message)
                .filter(Message.id == self._asId(messageId), Message.directChatId == chat.id, Message.isDeleted == False)
                .first()
            )
            if not message:
                raise LookupError("Wiadomość nie istnieje")

            if message.authorId != user.id and not self._isWorkspaceAdmin(session, user.id, chat.workspaceId):
                raise PermissionError("Brak uprawnień do usunięcia wiadomości")

            message.isDeleted = True
            session.commit()

    ################################################################################################################
    #                                              REACTION METHODS                                                #
    ################################################################################################################

    # ---------------------------------- CHANNEL REACTIONS ----------------------------------

    def addReactionChannel(self, workspaceId, channelId, messageId, emoji, authorEmail):
        emoji = (emoji or "").strip()
        if not emoji:
            raise ValueError("Emoji jest wymagane")

        with Session(self.app_engine) as session:
            user, channel = self._getChannelForMember(session, workspaceId, channelId, authorEmail)

            message = (
                session.query(Message)
                .filter(Message.id == self._asId(messageId), Message.channelId == channel.id, Message.isDeleted == False)
                .first()
            )
            if not message:
                raise LookupError("Wiadomość nie istnieje")

            reaction = Reaction(messageId=message.id, userId=user.id, emoji=emoji)
            session.add(reaction)
            session.commit()
            session.refresh(reaction)
            return self._serializeReaction(reaction)

    def deleteReactionChannel(self, workspaceId, channelId, messageId, reactionId, requesterEmail):
        with Session(self.app_engine) as session:
            user, channel = self._getChannelForMember(session, workspaceId, channelId, requesterEmail)

            message = (
                session.query(Message)
                .filter(Message.id == self._asId(messageId), Message.channelId == channel.id, Message.isDeleted == False)
                .first()
            )
            if not message:
                raise LookupError("Wiadomość nie istnieje")

            reaction = (
                session.query(Reaction)
                .filter(Reaction.id == self._asId(reactionId), Reaction.messageId == message.id)
                .first()
            )
            if not reaction:
                raise LookupError("Reakcja nie istnieje")

            if reaction.userId != user.id and not self._isWorkspaceAdmin(session, user.id, channel.workspaceId):
                raise PermissionError("Brak uprawnień do usunięcia reakcji")

            session.delete(reaction)
            session.commit()

    # ---------------------------------- DIRECT CHAT REACTIONS ----------------------------------

    def addReactionChat(self, workspaceId, directChatId, messageId, emoji, authorEmail):
        emoji = (emoji or "").strip()
        if not emoji:
            raise ValueError("Emoji jest wymagane")

        with Session(self.app_engine) as session:
            user, chat = self._getChatForMember(session, workspaceId, directChatId, authorEmail)

            message = (
                session.query(Message)
                .filter(Message.id == self._asId(messageId), Message.directChatId == chat.id, Message.isDeleted == False)
                .first()
            )
            if not message:
                raise LookupError("Wiadomość nie istnieje")

            reaction = Reaction(messageId=message.id, userId=user.id, emoji=emoji)
            session.add(reaction)
            session.commit()
            session.refresh(reaction)
            return self._serializeReaction(reaction)

    def deleteReactionChat(self, workspaceId, directChatId, messageId, reactionId, requesterEmail):
        with Session(self.app_engine) as session:
            user, chat = self._getChatForMember(session, workspaceId, directChatId, requesterEmail)

            message = (
                session.query(Message)
                .filter(Message.id == self._asId(messageId), Message.directChatId == chat.id, Message.isDeleted == False)
                .first()
            )
            if not message:
                raise LookupError("Wiadomość nie istnieje")

            reaction = (
                session.query(Reaction)
                .filter(Reaction.id == self._asId(reactionId), Reaction.messageId == message.id)
                .first()
            )
            if not reaction:
                raise LookupError("Reakcja nie istnieje")

            if reaction.userId != user.id and not self._isWorkspaceAdmin(session, user.id, chat.workspaceId):
                raise PermissionError("Brak uprawnień do usunięcia reakcji")

            session.delete(reaction)
            session.commit()

    ################################################################################################################
    #                                              DIRECT CHAT METHODS                                             #
    ################################################################################################################

    def listAllDirectChats(self, workspaceId, userEmail):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == userEmail).first()
            if not user:
                raise ValueError("Uzytkownik nie istnieje")

            workspace = session.query(Workspace).filter(Workspace.id == int(workspaceId)).first()
            if not workspace:
                raise ValueError("Workspace nie istnieje")

            membership = (
                session.query(WorkSpaceUser)
                .filter(WorkSpaceUser.workspaceId == int(workspaceId), WorkSpaceUser.userId == user.id)
                .first()
            )
            if not membership:
                raise PermissionError("Uzytkownik nie nalezy do tego workspace")

            chats = (
                session.query(DirectChat)
                .filter(
                    DirectChat.workspaceId == int(workspaceId),
                    (DirectChat.user1Id == user.id) | (DirectChat.user2Id == user.id),
                )
                .all()
            )

            result = []
            for chat in chats:
                other = chat.user2 if chat.user1Id == user.id else chat.user1

                read = (
                    session.query(DirectChatUser)
                    .filter(
                        DirectChatUser.directChatId == chat.id,
                        DirectChatUser.userId == user.id,
                    )
                    .first()
                )

                count_filter = [
                    Message.directChatId == chat.id,
                    Message.authorId == other.id,
                    Message.isDeleted == False,
                ]
                if read and read.lastReadAt is not None:
                    count_filter.append(Message.createAt > read.lastReadAt)

                new_messages_count = session.query(Message).filter(*count_filter).count()

                result.append({
                    "id": str(chat.id),
                    "participant": {
                        "id": str(other.id),
                        "name": other.name,
                        "surname": other.surname,
                        "email": other.email,
                        "avatarUrl": other.avatarUrl,
                        "status": other.status.value,
                    },
                    "newMessagesCount": new_messages_count,
                })

            return result

    def markDirectChatRead(self, workspaceId, directChatId, userEmail):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == userEmail).first()
            if not user:
                raise ValueError("Uzytkownik nie istnieje")

            chat = (
                session.query(DirectChat)
                .filter(
                    DirectChat.id == int(directChatId),
                    DirectChat.workspaceId == int(workspaceId),
                )
                .first()
            )
            if not chat:
                raise ValueError("Czat nie istnieje")

            if user.id not in (chat.user1Id, chat.user2Id):
                raise PermissionError("Uzytkownik nie nalezy do tego czatu")

            read = (
                session.query(DirectChatUser)
                .filter(
                    DirectChatUser.directChatId == chat.id,
                    DirectChatUser.userId == user.id,
                )
                .first()
            )
            if read:
                read.lastReadAt = datetime.now()
            else:
                read = DirectChatUser(directChatId=chat.id, userId=user.id, lastReadAt=datetime.now())
                session.add(read)
            session.commit()

    ################################################################################################################
    #                                              USER METHODS                                                    #
    ################################################################################################################

    def getUserById(self, userId):
        with Session(self.app_engine) as session:
            return session.query(User).filter(User.id == userId).first()

    def getWorkspaceById(self, workspaceId):
        with Session(self.app_engine) as session:
            return session.query(Workspace).filter(Workspace.id == workspaceId).first()

    def getWorkspaceRole(self, userId, workspaceId):
        with Session(self.app_engine) as session:
            membership = (
                session.query(WorkSpaceUser).filter(WorkSpaceUser.userId == userId, WorkSpaceUser.workspaceId == workspaceId).first())
            if membership is None:
                return None
            return membership.role.value

    def isOwnerOrAdminAnywhere(self, userId):
        with Session(self.app_engine) as session:
            membership = (session.query(WorkSpaceUser).filter(WorkSpaceUser.userId == userId, WorkSpaceUser.role.in_(
                [WorkspaceUserRole.owner, WorkspaceUserRole.admin])).first())
            return membership is not None

    def updateUserProfile(self, email, name, surname, status, avatarUrl=None):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == email).first()
            if user is None:
                return False
            user.name = name
            user.surname = surname
            user.status = UserStatus(status)
            if avatarUrl is not None:
                user.avatarUrl = avatarUrl
            session.commit()
            return True

    def deleteUserAccount(self, email):
        with Session(self.app_engine) as session:
            user = session.query(User).filter(User.email == email).first()
            if user is None:
                return False

            chat_ids = [c.id for c in session.query(DirectChat.id).filter(
                (DirectChat.user1Id == user.id) | (DirectChat.user2Id == user.id))]

            msg_filter = (Message.authorId == user.id)
            if chat_ids:
                msg_filter = msg_filter | Message.directChatId.in_(chat_ids)
            msg_ids = [m.id for m in session.query(Message.id).filter(msg_filter)]

            if msg_ids:
                session.query(Reaction).filter(Reaction.messageId.in_(msg_ids)).delete()
                session.query(Attachment).filter(Attachment.messageId.in_(msg_ids)).delete()
                session.query(Message).filter(Message.parentMessageId.in_(msg_ids)).update(
                    {Message.parentMessageId: None})
                session.query(Message).filter(Message.id.in_(msg_ids)).delete()

            session.query(Reaction).filter(Reaction.userId == user.id).delete()
            session.query(Attachment).filter(Attachment.userId == user.id).delete()
            if chat_ids:
                session.query(DirectChatUser).filter(DirectChatUser.directChatId.in_(chat_ids)).delete()
                session.query(DirectChat).filter(DirectChat.id.in_(chat_ids)).delete()
            session.query(ChannelUser).filter(ChannelUser.userId == user.id).delete()
            session.query(WorkSpaceUser).filter(WorkSpaceUser.userId == user.id).delete()
            session.delete(user)
            session.commit()
            return True

    def addUserToWorkspace(self, workspaceId, userId):
        with Session(self.app_engine) as session:
            session.add(WorkSpaceUser(workspaceId=workspaceId, userId=userId, role=WorkspaceUserRole.member))
            session.commit()

    def removeUserFromWorkspace(self, workspaceId, userId):
        with Session(self.app_engine) as session:
            channel_ids = [c.id for c in session.query(Channel.id).filter(Channel.workspaceId == workspaceId)]
            if channel_ids:
                session.query(ChannelUser).filter(ChannelUser.userId == userId, ChannelUser.channelId.in_(channel_ids)).delete()

            session.query(WorkSpaceUser).filter(WorkSpaceUser.userId == userId, WorkSpaceUser.workspaceId == workspaceId).delete()
            session.commit()

    def updateUserRoleInWorkspace(self, workspaceId, userId, newRole):
        with Session(self.app_engine) as session:
            membership = (session.query(WorkSpaceUser).filter(WorkSpaceUser.userId == userId,
                                                              WorkSpaceUser.workspaceId == workspaceId).first())
            if membership is None:
                return False
            membership.role = WorkspaceUserRole(newRole)
            session.commit()
            return True

    def searchUsersByEmail(self, emailRegex, limit=20):
        with Session(self.app_engine) as session:
            return session.query(User).filter(User.email.op("~*")(emailRegex)).limit(limit).all()
