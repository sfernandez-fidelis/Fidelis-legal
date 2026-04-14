export function getRenderableSignatureNames(signatureNames: string[] | undefined) {
  return (signatureNames ?? []).map((name) => name.trim()).filter(Boolean);
}
