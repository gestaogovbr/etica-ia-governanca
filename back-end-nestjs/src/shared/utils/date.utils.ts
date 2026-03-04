//função que recebe um  objeto e navega por ele para identficar se há valores timestamp do firebase e converte para data usando o toDate()

export function convertTimestampToDateFirestore(
  obj: Record<string, unknown>,
): any {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value && typeof value === 'object') {
          if ((value as { toDate?: () => Date }).toDate) {
            obj[key] = (value as { toDate: () => Date }).toDate();
          } else {
            convertTimestampToDateFirestore(value as Record<string, unknown>);
          }
        }
      }
    }
  }
  return obj;
}
