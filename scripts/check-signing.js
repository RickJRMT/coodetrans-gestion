if (!process.env.WIN_CSC_LINK) {
  throw new Error("Falta WIN_CSC_LINK en el archivo .env");
}

if (!process.env.WIN_CSC_KEY_PASSWORD) {
  throw new Error("Falta WIN_CSC_KEY_PASSWORD en el archivo .env");
}

console.log("✔ Configuración de firma encontrada.");