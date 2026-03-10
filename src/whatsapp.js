export function buildLink(phone, message) {
  const strippedPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${strippedPhone}?text=${encodeURIComponent(message)}&app_absent=1`;
}
