import type {
  TypeWorkspaceMemberIdentity,
  TypeWorkspaceMemberColorIndex,
} from "@/types";

const WORKSPACE_MEMBER_COLOR_COUNT = 10;
export const WORKSPACE_MEMBER_COLOR_INDICES: TypeWorkspaceMemberColorIndex[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
];

export function isWorkspaceMemberColorIndex(
  colorIndex: number | null | undefined,
): colorIndex is TypeWorkspaceMemberColorIndex {
  return (
    typeof colorIndex === "number" &&
    Number.isInteger(colorIndex) &&
    colorIndex >= 1 &&
    colorIndex <= 9
  );
}

export function getWorkspaceMemberColorIndices(
  members: TypeWorkspaceMemberIdentity[],
) {
  const memberColorIndices = new Map<string, TypeWorkspaceMemberColorIndex>();
  const nonOwners = members
    .filter((member) => member.role !== "owner")
    .sort((first, second) => {
      const joinedAtDifference =
        new Date(first.joinedAt).getTime() -
        new Date(second.joinedAt).getTime();
      return joinedAtDifference || first.userId.localeCompare(second.userId);
    });

  for (const owner of members.filter((member) => member.role === "owner")) {
    memberColorIndices.set(owner.userId, 0);
  }
  nonOwners.forEach((member, index) => {
    const colorIndex = isWorkspaceMemberColorIndex(member.colorIndex)
      ? member.colorIndex
      : WORKSPACE_MEMBER_COLOR_INDICES[
          index % (WORKSPACE_MEMBER_COLOR_COUNT - 1)
        ];
    memberColorIndices.set(member.userId, colorIndex);
  });

  return memberColorIndices;
}

export function getWorkspaceMemberColor(
  colorIndex: TypeWorkspaceMemberColorIndex | null,
) {
  return colorIndex === null || colorIndex === 0
    ? "primary.main"
    : `var(--workspace-member-color-${colorIndex})`;
}
