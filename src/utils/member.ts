import type { FamilyMember } from '../domain/models';

/** « Jean Michel Henri » — prénom et nom, sans le titre. */
export function getMemberFullName(member: FamilyMember): string {
  return [member.firstName, member.lastName].filter(Boolean).join(' ');
}

/**
 * « Tonton Jean Michel Henri » — pour les libellés texte (aria-label, titres).
 * À l'écran, le titre est rendu séparément par `MemberName` afin d'être grisé.
 */
export function getMemberDisplayName(member: FamilyMember): string {
  const title = formatMemberTitle(member);
  return title ? `${title} ${getMemberFullName(member)}` : getMemberFullName(member);
}

/** « Toky » — utilisé dans le fil d'activité. */
export function getMemberShortName(member: FamilyMember): string {
  return member.firstName;
}

/**
 * Le titre s'affiche exactement comme il a été saisi : « Tonton », « Dr », « PDG ».
 * Les sigles gardent donc leurs majuscules.
 */
export function formatMemberTitle(member: FamilyMember): string {
  return member.title?.trim() ?? '';
}

export function getMemberInitials(member: FamilyMember): string {
  const words = getMemberFullName(member).split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toLocaleUpperCase('fr-FR');
  }

  return (words[0] ?? '?').slice(0, 2).toLocaleUpperCase('fr-FR');
}
