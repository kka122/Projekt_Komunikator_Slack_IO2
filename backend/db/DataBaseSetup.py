from sqlalchemy import create_engine, Column, Integer, String, Text, text, Enum, DateTime, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.orm import declarative_base, relationship, Session
from db.DataTypes import WorkspaceUserRole, UserStatus
from datetime import datetime
from sqlalchemy.exc import IntegrityError

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


    def addUser(self, name, surname, email, password=None, avatarUrl="", googleId=None):
        password = password if password else None
        googleId = googleId if googleId else None

        if (password is None and googleId is None) or (password is not None and googleId is not None):
            raise ValueError("Dokladnie jedno z pol: password albo googleId musi byc ustawione")

        with Session(self.app_engine) as session:
            if session.query(User).filter(User.email == email).first():
                raise ValueError("Uzytkownik z tym emailem juz istnieje")

            if googleId and session.query(User).filter(User.googleId == googleId).first():
                raise ValueError("Uzytkownik z tym googleId juz istnieje")

            new_user = User(
                name=name,
                surname=surname,
                email=email,
                password=password,
                googleId=googleId,
                avatarUrl=avatarUrl
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
                    User.password == password,
                    User.googleId.is_(None)
                )
                .first()
            )
            return user is not None

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

            channels = (
                session.query(Channel)
                .join(ChannelUser, Channel.id == ChannelUser.channelId)
                .filter(
                    Channel.workspaceId == workspaceId,
                    ChannelUser.userId == user.id
                )
                .all()
            )
            return channels

    ################################################################################################################
    #                                              WORKSPACE METHODS                                                 #
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
            membership = (session.query(WorkSpaceUser).filter(WorkSpaceUser.userId == userId, WorkSpaceUser.workspaceId == workspaceId).first())
            if membership is None:
                return None
            return membership.role.value

    def isOwnerOrAdminAnywhere(self, userId):
        with Session(self.app_engine) as session:
            membership = (session.query(WorkSpaceUser).filter(WorkSpaceUser.userId == userId, WorkSpaceUser.role.in_([WorkspaceUserRole.owner, WorkspaceUserRole.admin])).first())
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
                session.query(ChannelUser).filter(ChannelUser.userId == userId,ChannelUser.channelId.in_(channel_ids)).delete()

            session.query(WorkSpaceUser).filter(WorkSpaceUser.userId == userId,WorkSpaceUser.workspaceId == workspaceId).delete()
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

