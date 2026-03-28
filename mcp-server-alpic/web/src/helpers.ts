import { generateHelpers } from "skybridge/web";

// Type inference across packages fails with skybridge generics,
// so we use `any` to avoid `never` constraints on widget hooks.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { useToolInfo, useCallTool } = generateHelpers<any>();
