from sqlalchemy import create_engine, Column, Integer, String, Text, text, Enum, DateTime, ForeignKey,Boolean
from sqlalchemy.orm import declarative_base,relationship
from DataTypes import WorkspaceUserRole, UserStatus
from datetime import datetime

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
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    status = Column(Enum(UserStatus), nullable=False, default=Enum(str(UserStatus.offline)))
    avatarUrl = Column(String, nullable=False, default="")
    createAt = Column(DateTime, default=datetime.now)

    workspace_users = relationship("WorkSpaceUser", back_populates="user",cascade="all, delete-orphan")
    channels = relationship("ChannelUser", back_populates="user")
    messages = relationship("Message", back_populates="user")
    reactions = relationship("Reaction", back_populates="user")
    attachments = relationship("Attachment", back_populates="user")
    direct_chats_as_user1 = relationship("DirectChat",foreign_keys="DirectChat.user1Id",back_populates="user1")
    direct_chats_as_user2 = relationship("DirectChat",foreign_keys="DirectChat.user2Id",back_populates="user2")

class Workspace(Base):
    __tablename__ = "workspace"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    logoUrl = Column(String, nullable=False)

    workspace_users = relationship("WorkSpaceUser", back_populates="workspace",cascade="all, delete-orphan")
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
    def __init__(self,*,PORT = 6000,BASE_NAME = "baza_danych",PASSWORD = "1234"):
        self.PORT = PORT
        self.BASE_NAME = BASE_NAME
        self.PASSWORD = PASSWORD
        self.SETUP_DATABASE_URI = f"postgresql+psycopg2://postgres:{PASSWORD}@localhost:{PORT}/postgres"
        self.APP_DATABASE_URI = f"postgresql+psycopg2://postgres:{self.PASSWORD}@localhost:{self.PORT}/{self.BASE_NAME}"
        self.app_engine = None

    def _createDataBase(self):
        set_engine = create_engine(self.SETUP_DATABASE_URI,isolation_level="AUTOCOMMIT")

        with set_engine.connect() as conn:
            result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :name"),{"name": self.BASE_NAME})
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

    def initialize(self):
        self._createTables()