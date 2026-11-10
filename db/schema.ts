/**
 * MongoDB schema for the notebook.
 * Describes collections, validators, and indexes only.
 * Nothing in this file connects to a database or creates anything.
 */

export const schemaVersion = 1;

const objectId = { bsonType: "objectId" } as const;
const date = { bsonType: "date" } as const;

const block = {
  bsonType: "object",
  required: ["type"],
  oneOf: [
    {
      required: ["type", "text"],
      properties: {
        type: { enum: ["p"] },
        text: { bsonType: "string" },
      },
      additionalProperties: false,
    },
    {
      required: ["type", "items"],
      properties: {
        type: { enum: ["list"] },
        items: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
      },
      additionalProperties: false,
    },
    {
      required: ["type", "language", "code"],
      properties: {
        type: { enum: ["code"] },
        language: { bsonType: "string" },
        code: { bsonType: "string" },
      },
      additionalProperties: false,
    },
  ],
} as const;

export const collections = {
  conversations: {
    name: "conversations",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["title", "createdAt", "updatedAt", "schemaVersion"],
        additionalProperties: false,
        properties: {
          _id: objectId,
          title: { bsonType: "string", maxLength: 200 },
          createdAt: date,
          updatedAt: date,
          schemaVersion: { bsonType: "int", minimum: 1 },
        },
      },
    },
    indexes: [{ key: { updatedAt: -1 }, name: "conversations_by_recent" }],
  },
  messages: {
    name: "messages",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["conversationId", "role", "createdAt", "schemaVersion"],
        additionalProperties: false,
        properties: {
          _id: objectId,
          conversationId: objectId,
          role: { enum: ["user", "assistant"] },
          text: { bsonType: "string" },
          blocks: {
            bsonType: "array",
            items: block,
          },
          createdAt: date,
          schemaVersion: { bsonType: "int", minimum: 1 },
        },
        oneOf: [
          {
            properties: { role: { enum: ["user"] } },
            required: ["text"],
          },
          {
            properties: { role: { enum: ["assistant"] } },
            required: ["blocks"],
          },
        ],
      },
    },
    indexes: [
      {
        key: { conversationId: 1, createdAt: 1 },
        name: "messages_by_conversation",
      },
    ],
  },
} as const;

export type Conversation = {
  title: string;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
};

export type ParagraphBlock = { type: "p"; text: string };
export type ListBlock = { type: "list"; items: string[] };
export type CodeBlock = { type: "code"; language: string; code: string };
export type Block = ParagraphBlock | ListBlock | CodeBlock;

export type UserMessage = {
  conversationId: string;
  role: "user";
  text: string;
  createdAt: Date;
  schemaVersion: number;
};

export type AssistantMessage = {
  conversationId: string;
  role: "assistant";
  blocks: Block[];
  createdAt: Date;
  schemaVersion: number;
};

export type Message = UserMessage | AssistantMessage;
