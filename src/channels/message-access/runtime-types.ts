import type { AccessGroupConfig } from "../../config/types.access-groups.js";
import type {
  AccessGroupMembershipFact,
  AccessGraphGate,
  ChannelIngressChannelId,
  ChannelIngressDecision,
  ChannelIngressEventInput,
  ChannelIngressIdentifierKind,
  ChannelIngressPolicyInput,
  ChannelIngressState,
  ChannelIngressStateInput,
  IngressReasonCode,
  InternalChannelIngressAdapter,
  InternalChannelIngressSubject,
  InternalMatchMaterial,
  InternalNormalizedEntry,
  RouteGateFacts,
} from "./types.js";

export type ChannelIngressSubjectIdentifier = InternalMatchMaterial;
export type ChannelIngressSubject = InternalChannelIngressSubject;
export type ChannelIngressAdapterEntry = InternalNormalizedEntry;
export type ChannelIngressAdapter = InternalChannelIngressAdapter;

export type ChannelIngressIdentityField = {
  key?: string;
  kind?: ChannelIngressIdentifierKind;
  normalize?: (value: string) => string | null | undefined;
  normalizeEntry?: (value: string) => string | null | undefined;
  normalizeSubject?: (value: string) => string | null | undefined;
  dangerous?: boolean | ((value: string) => boolean | undefined);
  sensitivity?: "normal" | "pii";
};

export type ChannelIngressIdentityAlias = ChannelIngressIdentityField & {
  key: string;
};

export type ChannelIngressIdentityDescriptor = {
  primary: ChannelIngressIdentityField;
  aliases?: readonly ChannelIngressIdentityAlias[];
  isWildcardEntry?: (value: string) => boolean;
  matchEntry?: (params: {
    subject: ChannelIngressSubject;
    entry: ChannelIngressAdapterEntry;
    context: "dm" | "group" | "route" | "command";
  }) => boolean | undefined;
  resolveEntryId?: (params: {
    entry: string;
    entryIndex: number;
    fieldKey: string;
    fieldIndex: number;
  }) => string;
};

export type StableChannelIngressIdentityParams = ChannelIngressIdentityField &
  Pick<ChannelIngressIdentityDescriptor, "aliases" | "isWildcardEntry" | "matchEntry"> & {
    entryIdPrefix?: string;
    resolveEntryId?: ChannelIngressIdentityDescriptor["resolveEntryId"];
  };

export type ChannelIngressIdentitySubjectInput = {
  stableId?: string | number | null;
  aliases?: Record<string, string | number | null | undefined>;
};

export type ChannelIngressConfigInput = {
  accessGroups?: ChannelIngressStateInput["accessGroups"];
  commands?: { useAccessGroups?: boolean } | null;
} | null;

export type ChannelMessageIngressCommandInput = NonNullable<
  ChannelIngressPolicyInput["command"]
> & {
  commandOwnerAllowFrom?: Array<string | number> | null;
  groupOwnerAllowFrom?: "configured" | "none";
  directGroupAllowFrom?: "effective" | "none";
  commandGroupAllowFromFallbackToAllowFrom?: boolean;
};

export type ChannelIngressCommandPresetInput = Omit<
  Partial<ChannelMessageIngressCommandInput>,
  "useAccessGroups"
> & {
  requested?: boolean;
  useAccessGroups?: boolean | null;
  cfg?: ChannelIngressConfigInput;
};

export type ChannelIngressEventPresetInput = Partial<ChannelIngressEventInput> & {
  isGroup?: boolean;
};

export type ChannelIngressRouteDescriptor = {
  id: string;
  kind?: RouteGateFacts["kind"];
  configured?: boolean;
  matched?: boolean;
  allowed?: boolean;
  enabled?: boolean;
  precedence?: number;
  senderPolicy?: RouteGateFacts["senderPolicy"];
  senderAllowFrom?: Array<string | number> | null;
  senderAllowFromSource?: RouteGateFacts["senderAllowFromSource"];
  matchId?: string;
  blockReason?: string;
};

export type ChannelIngressAccessGroupMembershipResolver = (params: {
  name: string;
  group: AccessGroupConfig;
  channelId: ChannelIngressChannelId;
  accountId: string;
  subject: ChannelIngressIdentitySubjectInput;
}) => boolean | Promise<boolean>;

export type ResolveChannelMessageIngressParams = {
  channelId: string | ChannelIngressChannelId;
  accountId: string;
  identity: ChannelIngressIdentityDescriptor;
  subject: ChannelIngressIdentitySubjectInput;
  conversation: ChannelIngressStateInput["conversation"];
  event: ChannelIngressEventInput;
  policy: ChannelIngressPolicyInput;
  allowFrom?: Array<string | number> | null;
  groupAllowFrom?: Array<string | number> | null;
  route?: ChannelIngressRouteDescriptor | readonly ChannelIngressRouteDescriptor[];
  routeFacts?: RouteGateFacts[];
  accessGroups?: ChannelIngressStateInput["accessGroups"];
  accessGroupMembership?: readonly AccessGroupMembershipFact[];
  resolveAccessGroupMembership?: ChannelIngressAccessGroupMembershipResolver;
  accessGroupMatchedAllowFromEntry?: string | number | null;
  providerMissingFallbackApplied?: boolean;
  mentionFacts?: ChannelIngressStateInput["mentionFacts"];
  readStoreAllowFrom?: (params: {
    channelId: ChannelIngressChannelId;
    accountId: string;
    dmPolicy: ChannelIngressPolicyInput["dmPolicy"];
  }) => Promise<readonly (string | number)[] | null | undefined>;
  useDefaultPairingStore?: boolean;
  command?: ChannelMessageIngressCommandInput;
};

export type CreateChannelIngressResolverParams = Pick<
  ResolveChannelMessageIngressParams,
  | "channelId"
  | "accountId"
  | "identity"
  | "accessGroups"
  | "accessGroupMembership"
  | "resolveAccessGroupMembership"
  | "accessGroupMatchedAllowFromEntry"
  | "readStoreAllowFrom"
  | "useDefaultPairingStore"
> & {
  cfg?: ChannelIngressConfigInput;
  useAccessGroups?: boolean | null;
  defaultDmPolicy?: ChannelIngressPolicyInput["dmPolicy"];
  defaultGroupPolicy?: ChannelIngressPolicyInput["groupPolicy"];
  groupAllowFromFallbackToAllowFrom?: boolean;
  mutableIdentifierMatching?: ChannelIngressPolicyInput["mutableIdentifierMatching"];
};

export type ChannelIngressResolverMessageParams = Omit<
  ResolveChannelMessageIngressParams,
  | "channelId"
  | "accountId"
  | "identity"
  | "accessGroups"
  | "resolveAccessGroupMembership"
  | "accessGroupMatchedAllowFromEntry"
  | "readStoreAllowFrom"
  | "useDefaultPairingStore"
  | "event"
  | "policy"
  | "command"
> & {
  event?: ChannelIngressEventInput | ChannelIngressEventPresetInput;
  dmPolicy?: ChannelIngressPolicyInput["dmPolicy"];
  groupPolicy?: ChannelIngressPolicyInput["groupPolicy"];
  policy?: Partial<Omit<ChannelIngressPolicyInput, "dmPolicy" | "groupPolicy">>;
  command?: ChannelMessageIngressCommandInput | ChannelIngressCommandPresetInput | false;
};

export type ChannelIngressResolver = {
  message(params: ChannelIngressResolverMessageParams): Promise<ResolvedChannelMessageIngress>;
  command(params: ChannelIngressResolverMessageParams): Promise<ResolvedChannelMessageIngress>;
  event(params: ChannelIngressResolverMessageParams): Promise<ResolvedChannelMessageIngress>;
};

export type ResolveStableChannelMessageIngressParams = Omit<
  CreateChannelIngressResolverParams,
  "identity"
> &
  ChannelIngressResolverMessageParams & { identity?: StableChannelIngressIdentityParams };

export type ChannelIngressSenderAccess = {
  allowed: boolean;
  decision: ChannelIngressDecision["decision"];
  reasonCode: IngressReasonCode;
  gate?: AccessGraphGate;
  effectiveAllowFrom: string[];
  effectiveGroupAllowFrom: string[];
  providerMissingFallbackApplied: boolean;
};

export type ChannelIngressCommandAccess = {
  requested: boolean;
  authorized: boolean;
  shouldBlockControlCommand: boolean;
  reasonCode: IngressReasonCode;
  gate?: AccessGraphGate;
};

export type ChannelIngressRouteAccess = {
  allowed: boolean;
  reasonCode?: IngressReasonCode;
  reason?: string;
  gate?: AccessGraphGate;
};

export type ChannelIngressActivationAccess = {
  ran: boolean;
  allowed: boolean;
  shouldSkip: boolean;
  reasonCode: IngressReasonCode;
  effectiveWasMentioned?: boolean;
  shouldBypassMention?: boolean;
  gate?: AccessGraphGate;
};

export type ResolvedChannelMessageIngress = {
  state: ChannelIngressState;
  ingress: ChannelIngressDecision;
  senderAccess: ChannelIngressSenderAccess;
  routeAccess: ChannelIngressRouteAccess;
  commandAccess: ChannelIngressCommandAccess;
  activationAccess: ChannelIngressActivationAccess;
};
