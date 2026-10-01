// Synced from my-money-v2 (src/lib/i18n/labels.ts). Do not edit here: change it
// in the web repo and run `npm run sync:web`.
import type { AppLocale } from "@/lib/i18n/config";

const expensePtBR: Record<string, string> = {
  Groceries: "Mercado",
  "Eating out": "Restaurantes",
  Coffee: "Café",
  Transport: "Transporte",
  Gas: "Combustível",
  Parking: "Estacionamento",
  Rent: "Aluguel",
  Mortgage: "Financiamento imobiliário",
  Utilities: "Serviços essenciais",
  Internet: "Internet",
  Phone: "Telefone",
  Subscriptions: "Assinaturas",
  Entertainment: "Entretenimento",
  Shopping: "Compras",
  Clothing: "Roupas",
  Home: "Casa",
  Health: "Saúde",
  Pharmacy: "Farmácia",
  Fitness: "Atividade física",
  Insurance: "Seguros",
  Education: "Educação",
  Childcare: "Cuidados infantis",
  Pets: "Animais de estimação",
  Travel: "Viagens",
  Flights: "Voos",
  Hotels: "Hotéis",
  Gifts: "Presentes",
  Taxes: "Impostos",
  Fees: "Tarifas",
  Other: "Outros",
  Uncategorized: "Sem categoria",
};

const incomePtBR: Record<string, string> = {
  Payroll: "Salário",
  "Client work": "Trabalho para clientes",
  Reimbursement: "Reembolso",
  Bonus: "Bônus",
  Commission: "Comissão",
  Dividends: "Dividendos",
  Interest: "Juros",
  "Rental income": "Receita de aluguel",
  Royalties: "Royalties",
  Marketplace: "Marketplace",
  Refund: "Estorno",
  Gift: "Presente",
  Benefits: "Benefícios",
  Pension: "Aposentadoria",
  Other: "Outros",
};

export function localizeExpenseCategory(value: string, locale: AppLocale) {
  return locale === "pt-BR" ? (expensePtBR[value] ?? value) : value;
}

export function localizeIncomeCategory(value: string, locale: AppLocale) {
  return locale === "pt-BR" ? (incomePtBR[value] ?? value) : value;
}
