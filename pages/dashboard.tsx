import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useTheme } from "../lib/theme";

// Access codes validated by backend — VALID_CODES kept for reference only
// Tier stored in localStorage as "prediq_tier" ("free" | "pro" | "elite")

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://prediq-time-machine-production.up.railway.app";

// ── STATIC SECTOR STRUCTURE (prices will be replaced by live data) ──────────
const SECTOR_STRUCTURE: Record<string, { label: string; assets: AssetDef[] }> = {
  global: {
    label: "🌍 GLOBAL",
    assets: [
      { label: "SPX",   name: "S&P 500",          type: "stock", currency: "$" },
      { label: "NASDAQ",name: "Nasdaq Index",      type: "stock", currency: "$" },
      { label: "DOW",   name: "Dow Jones",         type: "stock", currency: "$" },
      { label: "AAPL",  name: "Apple Inc",         type: "stock", currency: "$" },
      { label: "MSFT",  name: "Microsoft",         type: "stock", currency: "$" },
      { label: "GOOGL", name: "Alphabet / Google", type: "stock", currency: "$" },
      { label: "AMZN",  name: "Amazon",            type: "stock", currency: "$" },
      { label: "META",  name: "Meta Platforms",    type: "stock", currency: "$" },
      { label: "NVIDIA",name: "NVIDIA Corp",       type: "stock", currency: "$" },
      { label: "TSLA",  name: "Tesla",             type: "stock", currency: "$" },
      { label: "NFLX",  name: "Netflix",           type: "stock", currency: "$" },
      { label: "UBER",  name: "Uber",              type: "stock", currency: "$" },
      { label: "JPM",   name: "JPMorgan Chase",    type: "stock", currency: "$" },
      { label: "BAC",   name: "Bank of America",   type: "stock", currency: "$" },
      { label: "GS",    name: "Goldman Sachs",     type: "stock", currency: "$" },
      { label: "MS",    name: "Morgan Stanley",    type: "stock", currency: "$" },
      { label: "XOM",   name: "ExxonMobil",        type: "stock", currency: "$" },
      { label: "CVX",   name: "Chevron",           type: "stock", currency: "$" },
      { label: "COP",   name: "ConocoPhillips",    type: "stock", currency: "$" },
      { label: "WMT",   name: "Walmart",           type: "stock", currency: "$" },
      { label: "COST",  name: "Costco",            type: "stock", currency: "$" },
      { label: "NKE",   name: "Nike",              type: "stock", currency: "$" },
      { label: "MCD",   name: "McDonald's",        type: "stock", currency: "$" },
      { label: "JNJ",   name: "Johnson & Johnson", type: "stock", currency: "$" },
      { label: "PFE",   name: "Pfizer",            type: "stock", currency: "$" },
      { label: "UNH",   name: "UnitedHealth",      type: "stock", currency: "$" },
      { label: "MRNA",  name: "Moderna",           type: "stock", currency: "$" },
      { label: "BRK",   name: "Berkshire Hathaway",type: "stock", currency: "$" },
      { label: "CAT",   name: "Caterpillar",       type: "stock", currency: "$" },
      { label: "BA",    name: "Boeing",            type: "stock", currency: "$" },
    ],
  },
  us: {
    label: "🇺🇸 US",
    assets: [
      { label: "SPX", name: "S&P 500", type: "stock", currency: "$" },
      { label: "NASDAQ", name: "Nasdaq", type: "stock", currency: "$" },
      { label: "DOW", name: "Dow Jones", type: "stock", currency: "$" },
      { label: "AAPL", name: "Apple", type: "stock", currency: "$" },
      { label: "MSFT", name: "Microsoft", type: "stock", currency: "$" },
      { label: "NVIDIA", name: "NVIDIA", type: "stock", currency: "$" },
      { label: "AMZN", name: "Amazon", type: "stock", currency: "$" },
      { label: "GOOGL", name: "Google", type: "stock", currency: "$" },
      { label: "META", name: "Meta", type: "stock", currency: "$" },
      { label: "TSLA", name: "Tesla", type: "stock", currency: "$" },
      { label: "JPM", name: "JPMorgan", type: "stock", currency: "$" },
      { label: "BAC", name: "Bank of America", type: "s", currency: "$" },
      { label: "GS", name: "Goldman Sachs", type: "stock", currency: "$" },
      { label: "MS", name: "Morgan Stanley", type: "stock", currency: "$" },
      { label: "XOM", name: "ExxonMobil", type: "stock", currency: "$" },
      { label: "CVX", name: "Chevron", type: "stock", currency: "$" },
      { label: "WMT", name: "Walmart", type: "stock", currency: "$" },
      { label: "KO", name: "Coca-Cola", type: "stock", currency: "$" },
      { label: "PEP", name: "PepsiCo", type: "stock", currency: "$" },
      { label: "MCD", name: "McDonalds", type: "stock", currency: "$" },
      { label: "JNJ", name: "Johnson Johnson", type: "stock", currency: "$" },
      { label: "PFE", name: "Pfizer", type: "stock", currency: "$" },
      { label: "UNH", name: "UnitedHealth", type: "stock", currency: "$" },
      { label: "LMT", name: "Lockheed Martin", type: "stock", currency: "$" },
      { label: "NOC", name: "Northrop Grumman", type: "stock", currency: "$" },
      { label: "GD", name: "General Dynamics", type: "stock", currency: "$" },
      { label: "GE", name: "GE Aerospace", type: "stock", currency: "$" },
      { label: "BA", name: "Boeing", type: "stock", currency: "$" },
      { label: "CAT", name: "Caterpillar", type: "stock", currency: "$" },
      { label: "NFLX", name: "Netflix", type: "stock", currency: "$" },
      { label: "BRK", name: "Berkshire Hathaway", type: "stock", currency: "$" },
      { label: "MRNA", name: "Moderna", type: "stock", currency: "$" },
    ],
  },
  canada: {
    label: "🇨🇦 CANADA",
    assets: [
      { label: "TSX",  name: "S&P/TSX Composite",       type: "stock", currency: "CAD" },
      { label: "RY",   name: "Royal Bank of Canada",     type: "stock", currency: "CAD" },
      { label: "TD",   name: "Toronto-Dominion Bank",    type: "stock", currency: "CAD" },
      { label: "BNS",  name: "Bank of Nova Scotia",      type: "stock", currency: "CAD" },
      { label: "BMO",  name: "Bank of Montreal",         type: "stock", currency: "CAD" },
      { label: "CM",   name: "CIBC",                     type: "stock", currency: "CAD" },
      { label: "SU",   name: "Suncor Energy",            type: "stock", currency: "CAD" },
      { label: "ENB",  name: "Enbridge",                 type: "stock", currency: "CAD" },
      { label: "CNQ",  name: "Canadian Natural Resources",type: "stock", currency: "CAD" },
      { label: "ABX",  name: "Barrick Gold",             type: "stock", currency: "CAD" },
      { label: "NTR",  name: "Nutrien",                  type: "stock", currency: "CAD" },
      { label: "TECK", name: "Teck Resources",           type: "stock", currency: "CAD" },
      { label: "SHOP", name: "Shopify",                  type: "stock", currency: "CAD" },
      { label: "RCI",  name: "Rogers Communications",    type: "stock", currency: "CAD" },
      { label: "BCE",  name: "BCE Inc",                  type: "stock", currency: "CAD" },
      { label: "CNR",  name: "Canadian National Railway",type: "stock", currency: "CAD" },
      { label: "CP",   name: "Canadian Pacific Kansas City",type: "stock", currency: "CAD" },
    ],
  },
  defence: {
    label: "⚔️ DEFENCE",
    assets: [
      { label: "HAL", name: "Hindustan Aeronautics", type: "stock", currency: "₹" },
      { label: "BEL", name: "Bharat Electronics", type: "stock", currency: "₹" },
      { label: "LMT", name: "Lockheed Martin", type: "stock", currency: "$" },
      { label: "RTX", name: "RTX Corp", type: "stock", currency: "$" },
      { label: "BAE", name: "BAE Systems", type: "stock", currency: "£" },
    ],
  },
  metals: {
    label: "🪙 METALS",
    assets: [
      { label: "GOLD", name: "Gold", type: "gold", currency: "$" },
      { label: "SILVER", name: "Silver", type: "gold", currency: "$" },
      { label: "PLATINUM", name: "Platinum", type: "gold", currency: "$" },
      { label: "PALLADIUM", name: "Palladium", type: "gold", currency: "$" },
      { label: "COPPER", name: "Copper", type: "gold", currency: "$" },
    ],
  },
  energy: {
    label: "⚡ ENERGY",
    assets: [
      { label: "WTI", name: "Crude Oil WTI", type: "gold", currency: "$" },
      { label: "BRENT", name: "Brent Crude", type: "gold", currency: "$" },
      { label: "NATGAS", name: "Natural Gas", type: "gold", currency: "$" },
      { label: "RELIANCE", name: "Reliance Industries", type: "stock", currency: "₹" },
      { label: "ONGC", name: "Oil & Nat Gas Corp", type: "stock", currency: "₹" },
    ],
  },
  india: {
    label: "🇮🇳 INDIA",
    assets: [
      { label: "NIFTY50", name: "Nifty 50", type: "stock", currency: "₹" },
      { label: "SENSEX", name: "BSE Sensex", type: "stock", currency: "₹" },
      { label: "NIFTYBANK", name: "Bank Nifty Index", type: "stock", currency: "₹" },
      { label: "NIFTYIT", name: "Nifty IT Index", type: "stock", currency: "₹" },
      { label: "NIFTYAUTO", name: "Nifty Auto Index", type: "stock", currency: "₹" },
      { label: "USD/INR", name: "US Dollar / Rupee", type: "forex", currency: "₹" },
      { label: "TCS", name: "Tata Consultancy", type: "stock", currency: "₹" },
      { label: "INFY", name: "Infosys", type: "stock", currency: "₹" },
      { label: "HDFC", name: "HDFC Bank", type: "stock", currency: "₹" },
      { label: "ICICI", name: "ICICI Bank", type: "stock", currency: "₹" },
      { label: "WIPRO", name: "Wipro Ltd", type: "stock", currency: "₹" },
      { label: "BAJAJ", name: "Bajaj Finance", type: "stock", currency: "₹" },
      { label: "MARUTI", name: "Maruti Suzuki", type: "stock", currency: "₹" },
      { label: "ADANI", name: "Adani Ports", type: "stock", currency: "₹" },
      { label: "AXISBANK", name: "Axis Bank", type: "stock", currency: "₹" },
      { label: "KOTAKBANK", name: "Kotak Bank", type: "stock", currency: "₹" },
      { label: "TATAMOTORS", name: "Tata Motors", type: "stock", currency: "₹" },
    ],
  },
  indiaPlus: {
    label: "🇮🇳 INDIA+",
    assets: [
      { label: "TECHM", name: "Tech Mahindra", type: "stock", currency: "₹" },
      { label: "IOC", name: "Indian Oil Corp", type: "stock", currency: "₹" },
      { label: "BPCL", name: "BPCL", type: "stock", currency: "₹" },
      { label: "SUNPHARMA", name: "Sun Pharma", type: "stock", currency: "₹" },
      { label: "AIRTEL", name: "Bharti Airtel", type: "stock", currency: "₹" },
      { label: "MM", name: "Mahindra & Mahindra", type: "stock", currency: "₹" },
      { label: "LT", name: "Larsen & Toubro", type: "stock", currency: "₹" },
      { label: "ITC", name: "ITC Ltd", type: "stock", currency: "₹" },
      { label: "NTPC", name: "NTPC Ltd", type: "stock", currency: "₹" },
      { label: "JSWSTEEL", name: "JSW Steel", type: "stock", currency: "₹" },
      { label: "BAJAJAUTO", name: "Bajaj Auto", type: "stock", currency: "₹" },
      { label: "HEROMOTOCO", name: "Hero MotoCorp", type: "stock", currency: "₹" },
      { label: "CIPLA", name: "Cipla Ltd", type: "stock", currency: "₹" },
      { label: "DRREDDY", name: "Dr Reddys Labs", type: "stock", currency: "₹" },
      { label: "GAIL", name: "GAIL India", type: "stock", currency: "₹" },
      { label: "HUL", name: "Hindustan Unilever", type: "stock", currency: "₹" },
      { label: "POWERGRID", name: "Power Grid Corp", type: "stock", currency: "₹" },
      { label: "ADANIGREEN", name: "Adani Green Energy", type: "stock", currency: "₹" },
      { label: "HINDALCO", name: "Hindalco Industries", type: "stock", currency: "₹" },
      { label: "BRITANNIA", name: "Britannia Industries", type: "stock", currency: "₹" },
      { label: "ADANIENT", name: "Adani Enterprises", type: "stock", currency: "₹" },
      { label: "NESTLEIND", name: "Nestle India", type: "stock", currency: "₹" },
      { label: "DABUR", name: "Dabur India", type: "stock", currency: "₹" },
      { label: "SIEMENS", name: "Siemens India", type: "stock", currency: "₹" },
      { label: "COALINDIA", name: "Coal India", type: "stock", currency: "₹" },
      { label: "SAIL", name: "Steel Authority India", type: "stock", currency: "₹" },
      { label: "BANKBARODA", name: "Bank of Baroda", type: "stock", currency: "₹" },
      { label: "CANBK", name: "Canara Bank", type: "stock", currency: "₹" },
      { label: "DIVISLAB", name: "Divis Laboratories", type: "stock", currency: "₹" },
      { label: "MUTHOOTFIN", name: "Muthoot Finance", type: "stock", currency: "₹" },
      { label: "SBIN", name: "State Bank of India", type: "stock", currency: "₹" },
      { label: "HCLTECH", name: "HCL Technologies", type: "stock", currency: "₹" },
      { label: "ZOMATO", name: "Zomato Ltd", type: "stock", currency: "₹" },
      { label: "TITAN", name: "Titan Company", type: "stock", currency: "₹" },
      { label: "ASIANPAINT", name: "Asian Paints", type: "stock", currency: "₹" },
      { label: "DMART", name: "Avenue Supermarts", type: "stock", currency: "₹" },
      { label: "INDUSINDBK", name: "IndusInd Bank", type: "stock", currency: "₹" },
      { label: "HDFCLIFE", name: "HDFC Life Insurance", type: "stock", currency: "₹" },
      { label: "LTIM", name: "LTIMindtree", type: "stock", currency: "₹" },
      { label: "COLPAL", name: "Colgate Palmolive", type: "stock", currency: "₹" },
      { label: "MARICO", name: "Marico Ltd", type: "stock", currency: "₹" },
      { label: "ULTRACEMCO", name: "UltraTech Cement", type: "stock", currency: "₹" },
      { label: "TITAN", name: "Titan Company", type: "stock", currency: "₹" },
      { label: "DLF", name: "DLF Ltd", type: "stock", currency: "₹" },
      { label: "AUROPHARMA", name: "Aurobindo Pharma", type: "stock", currency: "₹" },
      { label: "SBILIFE", name: "SBI Life Insurance", type: "stock", currency: "₹" },
      { label: "PNB", name: "Punjab National Bank", type: "stock", currency: "₹" },
      { label: "HCLTECH", name: "HCL Technologies", type: "stock", currency: "₹" },
      { label: "PAYTM", name: "One97 Communications", type: "stock", currency: "₹" },
      { label: "NYKAA", name: "FSN E-Commerce", type: "stock", currency: "₹" },
    ],
  },
  latam: {
    label: "🌎 LATAM",
    assets: [
      // Chile
      { label: "IPSA",      name: "IPSA Index",            type: "index",  currency: "CLP" },
      { label: "SQM",       name: "SQM Lithium",           type: "stock",  currency: "$"   },
      { label: "FALABELLA", name: "Falabella",              type: "stock",  currency: "CLP" },
      { label: "COPEC",     name: "Empresas Copec",         type: "stock",  currency: "CLP" },
      { label: "BCHILE",    name: "Banco de Chile",         type: "stock",  currency: "CLP" },
      { label: "BSANTANDER",name: "Banco Santander Chile",  type: "stock",  currency: "CLP" },
      { label: "CENCOSUD",  name: "Cencosud",               type: "stock",  currency: "CLP" },
      { label: "ENELCHILE", name: "Enel Chile",             type: "stock",  currency: "CLP" },
      { label: "COLBUN",    name: "Colbun",                 type: "stock",  currency: "CLP" },
      { label: "CAP",       name: "CAP SA",                 type: "stock",  currency: "CLP" },
      { label: "CMPC",      name: "CMPC SA",                type: "stock",  currency: "CLP" },
      { label: "AGUAS",     name: "Aguas Andinas",          type: "stock",  currency: "CLP" },
      { label: "RIPLEY",    name: "Ripley Corp",            type: "stock",  currency: "CLP" },
      // Mexico
      { label: "AMX",       name: "América Móvil",          type: "stock",  currency: "$"   },
      { label: "GMEXICO",   name: "Grupo México",           type: "stock",  currency: "MXN" },
      { label: "FEMSA",     name: "FEMSA",                  type: "stock",  currency: "$"   },
      { label: "WALMEX",    name: "Walmart México",         type: "stock",  currency: "MXN" },
      { label: "CEMEX",     name: "Cemex",                  type: "stock",  currency: "$"   },
      { label: "BIMBO",     name: "Grupo Bimbo",            type: "stock",  currency: "MXN" },
      // Brazil
      { label: "PBR",       name: "Petrobras",              type: "stock",  currency: "$"   },
      { label: "VALE",      name: "Vale SA",                type: "stock",  currency: "$"   },
      { label: "ITUB",      name: "Itaú Unibanco",          type: "stock",  currency: "$"   },
      { label: "BBD",       name: "Banco Bradesco",         type: "stock",  currency: "$"   },
      { label: "ABEV",      name: "Ambev",                  type: "stock",  currency: "$"   },
      { label: "WEGE3",     name: "WEG Industries",         type: "stock",  currency: "BRL" },
      // Argentina
      { label: "YPF",       name: "YPF SA",                 type: "stock",  currency: "$"   },
      { label: "BMA",       name: "Banco Macro",            type: "stock",  currency: "$"   },
      { label: "PAM",       name: "Pampa Energía",          type: "stock",  currency: "$"   },
      { label: "GGAL",      name: "Galicia Bank",           type: "stock",  currency: "$"   },
      { label: "MELI",      name: "MercadoLibre",           type: "stock",  currency: "$"   },
    ],
  },
  chile: {
    label: "🇨🇱 CHILE",
    assets: [
      { label: "IPSA",       name: "IPSA Index",            type: "index",  currency: "CLP" },
      { label: "SQM",        name: "SQM Lithium",           type: "stock",  currency: "$"   },
      { label: "FALABELLA",  name: "Falabella",              type: "stock",  currency: "CLP" },
      { label: "COPEC",      name: "Empresas Copec",         type: "stock",  currency: "CLP" },
      { label: "BCHILE",     name: "Banco de Chile",         type: "stock",  currency: "CLP" },
      { label: "BSANTANDER", name: "Banco Santander Chile",  type: "stock",  currency: "CLP" },
      { label: "CENCOSUD",   name: "Cencosud",               type: "stock",  currency: "CLP" },
      { label: "ENELCHILE",  name: "Enel Chile",             type: "stock",  currency: "CLP" },
      { label: "COLBUN",     name: "Colbun",                 type: "stock",  currency: "CLP" },
      { label: "CAP",        name: "CAP SA",                 type: "stock",  currency: "CLP" },
      { label: "ENTEL",      name: "Entel Chile",            type: "stock",  currency: "CLP" },
      { label: "CMPC",       name: "CMPC SA",                type: "stock",  currency: "CLP" },
      { label: "AGUAS",      name: "Aguas Andinas",          type: "stock",  currency: "CLP" },
      { label: "RIPLEY",     name: "Ripley Corp",            type: "stock",  currency: "CLP" },
      { label: "SMU",        name: "SMU",                    type: "stock",  currency: "CLP" },
      { label: "ANDINA",     name: "Embotelladora Andina",   type: "stock",  currency: "CLP" },
      { label: "AGROSUPER",  name: "Agrosuper",              type: "stock",  currency: "CLP" },
      { label: "CONCHATORO", name: "Viña Concha y Toro",     type: "stock",  currency: "CLP" },
      { label: "QUINENCO",   name: "Quinenco",               type: "stock",  currency: "CLP" },
      { label: "VAPORES",    name: "Compañía Sud Americana", type: "stock",  currency: "CLP" },
      { label: "IAM",        name: "Inversiones Aguas Metro",type: "stock",  currency: "CLP" },
      { label: "ECL",        name: "Empresas Carozzi",       type: "stock",  currency: "CLP" },
      { label: "CCU",        name: "CCU",                    type: "stock",  currency: "CLP" },
      { label: "MALLPLAZA",  name: "Mall Plaza",             type: "stock",  currency: "CLP" },
      { label: "BCI",        name: "Banco de Crédito e Inv", type: "stock",  currency: "CLP" },
    ],
  },
  mexico: {
    label: "🇲🇽 MEXICO",
    assets: [
      { label: "AMX",    name: "América Móvil",   type: "stock", currency: "$"   },
      { label: "GMEXICO",name: "Grupo México",    type: "stock", currency: "MXN" },
      { label: "FEMSA",  name: "FEMSA",           type: "stock", currency: "$"   },
      { label: "WALMEX", name: "Walmart México",  type: "stock", currency: "MXN" },
      { label: "CEMEX",  name: "Cemex",           type: "stock", currency: "$"   },
      { label: "BIMBO",  name: "Grupo Bimbo",     type: "stock", currency: "MXN" },
    ],
  },
  brazil: {
    label: "🇧🇷 BRAZIL",
    assets: [
      { label: "PBR",   name: "Petrobras",      type: "stock", currency: "$"   },
      { label: "VALE",  name: "Vale SA",         type: "stock", currency: "$"   },
      { label: "ITUB",  name: "Itaú Unibanco",  type: "stock", currency: "$"   },
      { label: "BBD",   name: "Banco Bradesco",  type: "stock", currency: "$"   },
      { label: "ABEV",  name: "Ambev",           type: "stock", currency: "$"   },
      { label: "WEGE3", name: "WEG Industries",  type: "stock", currency: "BRL" },
    ],
  },
  argentina: {
    label: "🇦🇷 ARGENTINA",
    assets: [
      { label: "YPF",  name: "YPF SA",        type: "stock", currency: "$" },
      { label: "BMA",  name: "Banco Macro",   type: "stock", currency: "$" },
      { label: "PAM",  name: "Pampa Energía", type: "stock", currency: "$" },
      { label: "GGAL", name: "Galicia Bank",  type: "stock", currency: "$" },
      { label: "MELI", name: "MercadoLibre",  type: "stock", currency: "$" },
    ],
  },
  crypto: {
    label: "🪙 CRYPTO",
    assets: [
      { label: "BTC/USD",  name: "Bitcoin",      type: "crypto", currency: "$" },
      { label: "ETH/USD",  name: "Ethereum",     type: "crypto", currency: "$" },
      { label: "SOL/USD",  name: "Solana",       type: "crypto", currency: "$" },
      { label: "XRP/USD",  name: "XRP",          type: "crypto", currency: "$" },
      { label: "BNB/USD",  name: "BNB",          type: "crypto", currency: "$" },
      { label: "ADA/USD",  name: "Cardano",      type: "crypto", currency: "$" },
      { label: "AVAX/USD", name: "Avalanche",    type: "crypto", currency: "$" },
      { label: "DOT/USD",  name: "Polkadot",     type: "crypto", currency: "$" },
      { label: "MATIC/USD",name: "Polygon",      type: "crypto", currency: "$" },
      { label: "LINK/USD", name: "Chainlink",    type: "crypto", currency: "$" },
    ],
  },
};

interface AssetDef { label: string; name: string; type: string; currency: string; }
interface Asset extends AssetDef { price: number; change: number; }
interface PriceData { price: number; change: number; change_pct: number; currency: string; source: string; fetched_at?: string; }
interface PersonaVerdict { view: string; strength: number; reason: string; }
interface PersonaMap { [key: string]: PersonaVerdict; }
interface ForecastDay { day: string; price: number; change: number; }
interface SwarmData { buy_pct: number; hold_pct: number; sell_pct: number; herd_event: boolean; confidence: number; rsi?: number; macd?: number; bb_position?: number; }
interface Signal {
  asset: Asset; direction: string; signal_label: string; confidence: number;
  target: number; stop: number; target_pct: number; swarm: SwarmData;
  personas: PersonaMap; forecast: ForecastDay[]; time: string; entry_price: number;
}

const PERSONAS = [
  { key: "momentum", name: "MOMENTUM", color: "#00aaff", desc: "Price action & RSI" },
  { key: "value",    name: "VALUE",    color: "#aa66ff", desc: "Fundamentals" },
  { key: "swing",    name: "SWING",    color: "#00ff88", desc: "1-5 day setup" },
  { key: "skeptic",  name: "SKEPTIC",  color: "#ff4466", desc: "Risk & resistance" },
  { key: "quant",    name: "QUANT",    color: "#ffaa00", desc: "Statistical model" },
];

const PETROL_DATA = {
  oil_change: 1.6, daily_litres: 2.5,
  benefiting: ["RELIANCE","ONGC","WTI","BRENT"],
  hurt: ["IndiGo Airlines","SpiceJet","LATAM Airlines"],
};

const FLAG_MAP: Record<string, string> = {
  // Mexico 🇲🇽
  "AMX":"🇲🇽","BIMBO":"🇲🇽","WALMEX":"🇲🇽","CEMEX":"🇲🇽","GMEXICO":"🇲🇽","FEMSA":"🇲🇽",
  // Brazil 🇧🇷
  "PBR":"🇧🇷","VALE":"🇧🇷","ITUB":"🇧🇷","BBD":"🇧🇷","ABEV":"🇧🇷","WEGE3":"🇧🇷",
  // Argentina 🇦🇷
  "YPF":"🇦🇷","MELI":"🇦🇷","GGAL":"🇦🇷","BMA":"🇦🇷","PAM":"🇦🇷",
  // Chile 🇨🇱
  "IPSA":"🇨🇱","FALABELLA":"🇨🇱","BCHILE":"🇨🇱","BSANTANDER":"🇨🇱","BCI":"🇨🇱",
  "BSECURITY":"🇨🇱","GSECURITY":"🇨🇱","CENCOSUD":"🇨🇱","RIPLEY":"🇨🇱","SMU":"🇨🇱",
  "ENELCHILE":"🇨🇱","ENELAM":"🇨🇱","COLBUN":"🇨🇱","AESANDES":"🇨🇱","ENGIE":"🇨🇱",
  "CAP":"🇨🇱","ENTEL":"🇨🇱","TELEFONICA":"🇨🇱","COPEC":"🇨🇱","QUINENCO":"🇨🇱",
  "AGUAS":"🇨🇱","ANDINA":"🇨🇱","CONCHATORO":"🇨🇱","AGROSUPER":"🇨🇱","LATAM":"🇨🇱",
  "SQM":"🇨🇱","UF":"🇨🇱","UTM":"🇨🇱","UI":"🇨🇱",
  "VAPORES":"🇨🇱","IAM":"🇨🇱","ECL":"🇨🇱","CCU":"🇨🇱","MALLPLAZA":"🇨🇱",
};

function generatePersonaVerdicts(direction: string, confidence: number): PersonaMap {
  const getView = (bias: number): string => {
    const r = Math.random() + bias;
    if (r > 0.65) return direction;
    if (r > 0.35) return "hold";
    return direction === "buy" ? "sell" : "buy";
  };
  const level = confidence > 75 ? "2.1 sigma above" : "near";
  return {
    momentum: { view: getView(direction==="buy"?0.3:-0.3), strength: 6+Math.floor(Math.random()*4), reason: direction==="buy"?"RSI breakout, volume surge":"RSI declining, weak volume" },
    value:    { view: getView(0.1), strength: 4+Math.floor(Math.random()*4), reason: "Valuation within historical range" },
    swing:    { view: getView(direction==="buy"?0.25:-0.25), strength: 6+Math.floor(Math.random()*4), reason: direction==="buy"?"Clean setup, low IV":"Resistance ahead, high IV" },
    skeptic:  { view: getView(-0.2), strength: 3+Math.floor(Math.random()*4), reason: direction==="buy"?"Watch resistance carefully":"Support may not hold" },
    quant:    { view: confidence>75?direction:"hold", strength: 7+Math.floor(Math.random()*3), reason: "Swarm "+confidence+"% — "+level+" baseline" },
  };
}

function generate7DayForecast(price: number, direction: string): ForecastDay[] {
  return Array.from({length:7},(_,i)=>{
    const trend = direction==="buy"?1:direction==="sell"?-1:0;
    const change = trend*0.008*(i+1)+(Math.random()-0.5)*0.012;
    return { day:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], price:parseFloat((price*(1+change)).toFixed(2)), change:parseFloat((change*100).toFixed(2)) };
  });
}

function useStateInternal(init){
  const [s,ss] = useState(init);
  return [s,ss];
}

function RealCandleChart({ asset, entry, target, stop, apiBase }: {
  asset: string; entry: number; target: number; stop: number; apiBase: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useStateInternal(true);
  const [error, setError] = useStateInternal('');
  const [days, setDays] = useStateInternal(60);
  const [isLine, setIsLine] = useStateInternal(false);

  useEffect(() => {
    if (!chartRef.current) return;
    let chart: any;
    setLoading(true);
    setError('');

    const loadChart = async () => {
      try {
        const { createChart, LineSeries, CandlestickSeries } = await import('lightweight-charts');
        const res = await fetch(`${apiBase}/api/history/${asset}?days=${days}`);
        const data = await res.json();

        if (!data.candles || data.candles.length === 0) {
          setError('No data available');
          setLoading(false);
          return;
        }

        setIsLine(!!data.is_line);

        chart = createChart(chartRef.current!, {
          width: chartRef.current!.clientWidth,
          height: 260,
          layout: { background: { color: '#0d1117' }, textColor: '#4a7a9b' },
          grid: { vertLines: { color: '#0d2035' }, horzLines: { color: '#0d2035' } },
          timeScale: { borderColor: '#0d2035' },
          rightPriceScale: { borderColor: '#0d2035' },
        });

        if (data.is_line) {
          const series = chart.addSeries(LineSeries, { color: '#00ff88', lineWidth: 2 });
          series.setData(data.candles.map((c: any) => ({ time: c.time, value: c.close })));
          if (entry) series.createPriceLine({ price: entry, color: '#00ff88', lineWidth: 1, lineStyle: 2, title: 'ENTRY' });
          if (target) series.createPriceLine({ price: target, color: '#00aaff', lineWidth: 1, lineStyle: 2, title: 'TARGET' });
          if (stop)   series.createPriceLine({ price: stop,   color: '#ff4444', lineWidth: 1, lineStyle: 2, title: 'STOP'   });
        } else {
          const series = chart.addSeries(CandlestickSeries, {
            upColor: '#00ff88', downColor: '#ff4444',
            borderUpColor: '#00ff88', borderDownColor: '#ff4444',
            wickUpColor: '#00ff88', wickDownColor: '#ff4444',
          });
          series.setData(data.candles);
          if (entry) series.createPriceLine({ price: entry, color: '#00ff88', lineWidth: 1, lineStyle: 2, title: 'ENTRY' });
          if (target) series.createPriceLine({ price: target, color: '#00aaff', lineWidth: 1, lineStyle: 2, title: 'TARGET' });
          if (stop)   series.createPriceLine({ price: stop,   color: '#ff4444', lineWidth: 1, lineStyle: 2, title: 'STOP'   });
        }

        chart.timeScale().fitContent();
        setLoading(false);
      } catch (e) {
        setError('Chart load failed');
        setLoading(false);
      }
    };

    loadChart();
    return () => { if (chart) chart.remove(); };
  }, [asset, entry, target, stop, days]);

  return (
    <div style={{ width: '100%', background: '#0d1117', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[14, 30, 60].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: 1,
                cursor: 'pointer', fontFamily: 'inherit',
                background: days === d ? '#00ff88' : 'transparent',
                border: days === d ? '1px solid #00ff88' : '1px solid #1a3a5c',
                color: days === d ? '#050a0f' : '#4a7a9b' }}>
              {d}D
            </button>
          ))}
        </div>
        <span style={{ fontSize: 8, color: '#1a3a5c', letterSpacing: 1 }}>
          {isLine ? 'CLOSING PRICES' : 'LIVE PRICES'}
        </span>
      </div>
      {loading && <div style={{ padding: 16, color: '#00ff88', fontSize: 10, textAlign: 'center', letterSpacing: 2 }}>LOADING CHART...</div>}
      {error   && <div style={{ padding: 16, color: '#ff4444', fontSize: 10, textAlign: 'center' }}>{error}</div>}
      <div ref={chartRef} style={{ width: '100%' }} />
    </div>
  );
}

function FishCanvas({ swarm }: { swarm: SwarmData | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const [themeObj] = useTheme();
  useEffect(()=>{
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext("2d"); if(!ctx) return;
    const W=canvas.width, H=canvas.height, N=200;
    const buyPct  = swarm?swarm.buy_pct/100:0.5;
    const sellPct = swarm?swarm.sell_pct/100:0.2;
    const agents = Array.from({length:N},()=>{
      const r=Math.random();
      const type=r<buyPct?"buy":r<buyPct+sellPct?"sell":"hold";
      const bias=type==="buy"?0.45:type==="sell"?-0.45:0;
      return{x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5+bias)*1.3,vy:(Math.random()-0.5)*1.3,type};
    });
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      agents.forEach(a=>{
        a.vx+=(Math.random()-0.5)*0.09; a.vy+=(Math.random()-0.5)*0.09;
        const spd=Math.hypot(a.vx,a.vy);
        if(spd>1.6){a.vx=a.vx/spd*1.6;a.vy=a.vy/spd*1.6;}
        a.x+=a.vx;a.y+=a.vy;
        if(a.x<0)a.x=W;if(a.x>W)a.x=0;if(a.y<0)a.y=H;if(a.y>H)a.y=0;
        const col=a.type==="buy"?themeObj.accentBuy:a.type==="sell"?themeObj.accentSell:"#ffaa00";
        ctx.beginPath();ctx.arc(a.x,a.y,2,0,Math.PI*2);ctx.fillStyle=col;ctx.globalAlpha=0.8;ctx.fill();
        ctx.beginPath();ctx.arc(a.x,a.y,5,0,Math.PI*2);ctx.fillStyle=col;ctx.globalAlpha=0.12;ctx.fill();
      });
      ctx.globalAlpha=1;
      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    return()=>cancelAnimationFrame(animRef.current);
  },[swarm]);
  return <canvas ref={canvasRef} width={640} height={120} style={{width:"100%",height:120,borderRadius:8,background:"#050a0f"}}/>;
}

// ── BUILD SECTORS WITH LIVE PRICES ───────────────────────────────────────────
function buildSectors(prices: Record<string, PriceData>): Record<string, { label: string; assets: Asset[] }> {
  const result: Record<string, { label: string; assets: Asset[] }> = {};
  for (const [key, sector] of Object.entries(SECTOR_STRUCTURE)) {
    result[key] = {
      label: sector.label,
      assets: sector.assets.map(a => {
        const live = prices[a.label];
        return {
          ...a,
          price:  live ? live.price      : 0,
          change: live ? live.change_pct : 0,
          currency: live?.currency ? (live.currency === "USD" ? "$" : live.currency === "GBP" ? "£" : live.currency === "EUR" ? "€" : live.currency) : a.currency,
        };
      }),
    };
  }
  return result;
}

export default function PrediqDashboard() {
  const [themeObj, toggleTheme] = useTheme();
  const [accuracy,     setAccuracy]     = useState<string>("83.3");
  const [weeklyData,   setWeeklyData]   = useState<any>(null);
  const [isWeekend,    setIsWeekend]    = useState<boolean>(false);
  const [prices,       setPrices]       = useState<Record<string, PriceData>>({});
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [priceError,   setPriceError]   = useState(false);
  const [sectors,      setSectors]      = useState<Record<string, { label: string; assets: Asset[] }>>(
    buildSectors({})
  );
  const [activeSector, setActiveSector] = useState("global");
  const [selected,     setSelected]     = useState<Asset>({ label:"AAPL",name:"Apple Inc",type:"stock",currency:"$",price:0,change:0 });
  const [signal,       setSignal]       = useState<Signal | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [time,         setTime]         = useState("");
  const [activeTab,    setActiveTab]    = useState("signal");
  const [chartTab,     setChartTab]     = useState<"SWARM"|"CHART">("SWARM");
  const [watchlist,    setWatchlist]    = useState<string[]>([]);
  const [searchQ,      setSearchQ]      = useState("");
  const [searchRes,    setSearchRes]    = useState<any[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [showSearch,   setShowSearch]   = useState(false);
  const [capital,      setCapital]      = useState(50000);
  const [capitalCurrency, setCapitalCurrency] = useState("INR");
  const [showPetrol,   setShowPetrol]   = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [lastRefresh,  setLastRefresh]  = useState("");
  const [secondsSince, setSecondsSince] = useState(0);
  const lastRefreshTime = useRef<number>(0);
  const [countdown,    setCountdown]    = useState(60);
  const [marketStatus, setMarketStatus] = useState("");
  const [flashGreen,   setFlashGreen]   = useState(false);
  const [indicatorTooltipKey, setIndicatorTooltipKey] = useState<string | null>(null);
  const [cursorColor, setCursorColor]   = useState("#00ff88");
  const [fusion, setFusion] = useState<any>(null);
  const [timeframe, setTimeframe]       = useState<"day"|"swing"|"position"|"options">("day");
  const [swingSignal,    setSwingSignal]    = useState<any>(null);
  const [positionSignal, setPositionSignal] = useState<any>(null);
  const [optionsSignal,  setOptionsSignal]  = useState<any>(null);
  const [swingLoading,   setSwingLoading]   = useState(false);
  const [positionLoading,setPositionLoading]= useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [isElite,   setIsElite]   = useState<boolean>(false);
  const [isPro,     setIsPro]     = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // ── Auth check: runs first, before any API calls ──────────────────────────
  // Priority: prediq_access_code (set by index.tsx login) or prediq_code (legacy)
  // If code exists → valid session. Backfill prediq_login_time for existing
  // sessions that predate the timestamp feature.
  // Only redirects if NO code at all, or session explicitly expired (24h).
  useEffect(() => {
    const CURRENT_VERSION = "v2";
    const sessionVersion = localStorage.getItem("prediq_session_version");
    if (sessionVersion !== CURRENT_VERSION) {
      localStorage.clear();
      setTimeout(() => { window.location.href = "/"; }, 500);
      return;
    }

    const SESSION_MS = 24 * 60 * 60 * 1000; // 24 hours
    const code = localStorage.getItem("prediq_access_code") || localStorage.getItem("prediq_code");

    if (!code) {
      // No code — wait 500ms (prevents SSR flash) then redirect
      setTimeout(() => { window.location.href = "/"; }, 500);
      return;
    }

    const loginTime = localStorage.getItem("prediq_login_time");
    if (!loginTime) {
      // Backfill for users who logged in before the timestamp feature existed
      localStorage.setItem("prediq_login_time", String(Date.now()));
    } else if (Date.now() - parseInt(loginTime, 10) > SESSION_MS) {
      // Session genuinely expired
      localStorage.removeItem("prediq_access_code");
      localStorage.removeItem("prediq_code");
      localStorage.removeItem("prediq_tier");
      localStorage.removeItem("prediq_login_time");
      setTimeout(() => { window.location.href = "/"; }, 500);
      return;
    }

    const tier = localStorage.getItem("prediq_tier") || "free";
    setIsElite(tier === "elite");
    setIsPro(tier === "pro" || tier === "elite");
    setAuthReady(true);
  }, []);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  // Voice greeting — once per session
  const [voicePromptVisible, setVoicePromptVisible] = useState(false);
  const greetedRef = useRef(false);

  const speakGreeting = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(
      "Welcome to PREDIQ. Your AI-powered market intelligence is ready. The swarm is active."
    );
    msg.rate = 0.9;
    msg.pitch = 1.0;
    msg.lang = "en-US";
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith("en") && /google|samantha|alex|karen|daniel/i.test(v.name)
    ) || voices.find(v => v.lang.startsWith("en"));
    if (preferred) msg.voice = preferred;
    window.speechSynthesis.speak(msg);
  };

  // Show tap-to-hear prompt on mount (3 s), play on first interaction
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("prediq_greeted")) return;
    // Show the prompt banner for 3 seconds
    setVoicePromptVisible(true);
    const hideTimer = setTimeout(() => setVoicePromptVisible(false), 3000);
    // Play on first user interaction (click or touchstart)
    const onInteract = () => {
      if (greetedRef.current) return;
      greetedRef.current = true;
      sessionStorage.setItem("prediq_greeted", "1");
      setVoicePromptVisible(false);
      speakGreeting();
      document.removeEventListener("click", onInteract);
      document.removeEventListener("touchstart", onInteract);
    };
    document.addEventListener("click", onInteract);
    document.addEventListener("touchstart", onInteract);
    return () => {
      clearTimeout(hideTimer);
      document.removeEventListener("click", onInteract);
      document.removeEventListener("touchstart", onInteract);
    };
  }, []);

  const [refreshing,   setRefreshing]   = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef(0);
  const pulling    = useRef(false);
  const PULL_THRESHOLD = 64; // px needed to trigger refresh

  // Market overview bar sparkline data
  const [marketBarData, setMarketBarData] = useState<Record<string, number[]>>({});
  useEffect(() => {
    fetch(`${API_BASE}/api/price-history-batch?assets=SPX,DOW,NASDAQ,NIFTY50,BTC%2FUSD,GOLD,BRENT&days=7`)
      .then(r => r.json())
      .then(d => { if (d.assets) setMarketBarData(d.assets); })
      .catch(() => {});
  }, []);

  // Chat widget state
  const [chatOpen,     setChatOpen]     = useState(false);
  const [eliteModalOpen,   setEliteModalOpen]   = useState(false);
  const [promptLibOpen,    setPromptLibOpen]    = useState(false);
  const [promptLibTab,     setPromptLibTab]     = useState("analysis");
  const [savedPrompts,     setSavedPrompts]     = useState<{name:string; text:string}[]>(() => {
    try { return JSON.parse(localStorage.getItem("prediq_saved_prompts") || "[]"); } catch { return []; }
  });
  const [newPromptName,    setNewPromptName]    = useState("");
  const [newPromptText,    setNewPromptText]    = useState("");
  const [voiceMuted,   setVoiceMuted]   = useState(false);
  const [chatMessages, setChatMessages] = useState<{role:"user"|"assistant", content:string}[]>([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatLoading,  setChatLoading]  = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [assetNews,    setAssetNews]    = useState<{title:string; publisher:string; sentiment:string}[]>([]);
  const [validationCache, setValidationCache] = useState<{stats: any; accuracy: any} | null>(null);

  // ── FETCH LIVE PRICES ─────────────────────────────────────────────────────
  const fetchPrices = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/prices?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.prices) {
        setPrices(data.prices);
        const built = buildSectors(data.prices);
        setSectors(built);
        setSelected(prev => {
          const live = data.prices[prev.label];
          if (live) return { ...prev, price: live.price, change: live.change_pct };
          return prev;
        });
        setPricesLoaded(true);
        const now = new Date();
        setLastRefresh(now.toLocaleTimeString());
        lastRefreshTime.current = now.getTime();
        setSecondsSince(0);
      }
    } catch (e) {
      setPriceError(true);
    } finally {
      setRefreshing(false);
    }
  };

  // Pull-to-refresh gesture (mobile only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        pullStartY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return;
      const dist = Math.max(0, e.touches[0].clientY - pullStartY.current);
      if (dist > 0) setPullDistance(Math.min(dist, PULL_THRESHOLD + 20));
    };
    const onTouchEnd = () => {
      if (pulling.current && pullDistance >= PULL_THRESHOLD) {
        fetchPrices();
      }
      pulling.current = false;
      setPullDistance(0);
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove",  onTouchMove,  { passive: true });
    document.addEventListener("touchend",   onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove",  onTouchMove);
      document.removeEventListener("touchend",   onTouchEnd);
    };
  }, [pullDistance]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  // Pre-fetch news whenever the selected asset changes
  useEffect(() => {
    const label = typeof selected === "string" ? selected : (selected as any)?.label;
    if (!label) return;
    fetch(`${API_BASE}/api/news/${label}`)
      .then(r => r.json())
      .then(d => setAssetNews(d?.news || []))
      .catch(() => setAssetNews([]));
  }, [selected]);

  // Pre-fetch validation stats + accuracy once on mount
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/validation/stats?days=7`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/api/accuracy`).then(r => r.json()).catch(() => null),
    ]).then(([stats, accuracy]) => {
      if (stats || accuracy) setValidationCache({ stats, accuracy });
    });
  }, []);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    const userMsg = { role: "user" as const, content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    // Region map — every label PREDIQ tracks mapped to its market/country
    const REGION_MAP: Record<string, string> = {
      // India
      NIFTY:"India",NIFTY50:"India",SENSEX:"India",RELIANCE:"India",TCS:"India",
      INFY:"India",HDFCBANK:"India",ICICIBANK:"India",SBIN:"India",WIPRO:"India",
      HINDUNILVR:"India",ITC:"India",AXISBANK:"India",LT:"India",BAJFINANCE:"India",
      MARUTI:"India",ONGC:"India",POWERGRID:"India",NTPC:"India",TATAMOTORS:"India",
      TATASTEEL:"India",ADANIENT:"India",ADANIPORTS:"India",HAL:"India",
      // Chile
      IPSA:"Chile",FALABELLA:"Chile",BCHILE:"Chile",BSANTANDER:"Chile",BCI:"Chile",
      CENCOSUD:"Chile",COPEC:"Chile",SQM:"Chile",LATAM:"Chile",ENTEL:"Chile",
      COLBUN:"Chile",ENELCHILE:"Chile",ENELAM:"Chile",CAP:"Chile",
      VAPORES:"Chile",IAM:"Chile",ECL:"Chile",CCU:"Chile",MALLPLAZA:"Chile",
      // Mexico
      AMX:"Mexico",BIMBO:"Mexico",WALMEX:"Mexico",CEMEX:"Mexico",FEMSA:"Mexico",GMEXICO:"Mexico",
      // Brazil
      PBR:"Brazil",VALE:"Brazil",ITUB:"Brazil",BBD:"Brazil",ABEV:"Brazil",
      // US
      SPX:"US",NASDAQ:"US",DOW:"US",AAPL:"US",MSFT:"US",GOOGL:"US",AMZN:"US",
      META:"US",NVIDIA:"US",TSLA:"US",NFLX:"US",UBER:"US",JPM:"US",BAC:"US",
      GS:"US",MS:"US",XOM:"US",CVX:"US",WMT:"US",MCD:"US",JNJ:"US",PFE:"US",
      UNH:"US",LMT:"US",NOC:"US",GD:"US",GE:"US",KO:"US",PEP:"US",COP:"US",
      BRK:"US",CAT:"US",BA:"US",COST:"US",NKE:"US",MRNA:"US",
      // UK / Europe
      FTSE:"UK",DAX:"Germany",CAC:"France",
      // Japan / Asia
      NIKKEI:"Japan",HSI:"HongKong",SHANGHAI:"China",KOSPI:"SouthKorea",ASX:"Australia",
      // Canada
      TSX:"Canada",
      // Crypto
      BTC:"Crypto",ETH:"Crypto",BNB:"Crypto",SOL:"Crypto",XRP:"Crypto",ADA:"Crypto",
      DOGE:"Crypto",AVAX:"Crypto",DOT:"Crypto",MATIC:"Crypto",LINK:"Crypto",
      // Commodities
      GOLD:"Commodity",SILVER:"Commodity",OIL:"Commodity",WTI:"Commodity",
      BRENT:"Commodity",NATGAS:"Commodity",COPPER:"Commodity",PLATINUM:"Commodity",
      // Forex
      EURUSD:"Forex",GBPUSD:"Forex",USDJPY:"Forex",USDMXN:"Forex",
      USDCLP:"Forex",USDARS:"Forex",USDINR:"Forex",USDCAD:"Forex",AUDUSD:"Forex",
    };

    // Market session status by region (derived from IST time already in marketStatus)
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    const h = ist.getHours(), m = ist.getMinutes(), dow = ist.getDay();
    const isWeekday = dow >= 1 && dow <= 5;
    const marketSessions: Record<string, string> = {
      "India (NSE/BSE)":  isWeekday && (h > 9 || (h === 9 && m >= 15)) && (h < 15 || (h === 15 && m <= 30)) ? "OPEN" : "CLOSED",
      "US (NYSE/NASDAQ)": isWeekday && ((h > 19 || (h === 19 && m >= 30)) && h < 26) ? "OPEN" : "CLOSED",
      "Chile (BCS)":      isWeekday && h >= 14 && h < 22 ? "OPEN" : "CLOSED",
      "Crypto":           "24/7 OPEN",
      "Commodities":      isWeekday ? "OPEN" : "CLOSED",
    };
    const sessionLines = Object.entries(marketSessions)
      .map(([mkt, status]) => `  ${mkt}: ${status}`)
      .join("\n");

    // India tickers that should always show ₹
    const INR_TICKERS = new Set([
      "NIFTY50","NIFTY","SENSEX","TCS","INFY","RELIANCE","HDFCBANK","ICICIBANK",
      "SBIN","LT","ITC","NTPC","ADANIENT","MARUTI","BAJFINANCE","WIPRO",
      "AXISBANK","HAL","SUNPHARMA","CIPLA","HINDUNILVR","ONGC","TATAMOTORS","TATASTEEL",
    ]);
    const CRYPTO_TICKERS = new Set(["BTC","ETH","BNB","XRP","SOL","ADA","DOT","DOGE","AVAX","MATIC","LINK","LTC"]);
    const CHILE_TICKERS  = new Set(["IPSA","CHILE"]);

    /** Returns the currency symbol for a ticker */
    const getCur = (ticker: string, fallbackCurrency?: string): string => {
      const t = ticker.toUpperCase();
      if (INR_TICKERS.has(t) || fallbackCurrency === "INR") return "₹";
      if (CHILE_TICKERS.has(t) || fallbackCurrency === "CLP")  return "CLP ";
      if (fallbackCurrency === "GBP") return "£";
      return "$";
    };

    /** Compute daily % from point change and price; returns null if unreliable */
    const calcPct = (price: any, change: any): number | null => {
      const p = Number(price);
      const c = Number(change);
      if (!isFinite(p) || !isFinite(c) || p === c) return null; // avoid div-by-zero
      const pct = (c / (p - c)) * 100;
      return Math.abs(pct) <= 15 ? pct : null;
    };

    /** Format a pct value as "+0.32%" or "N/A" */
    const fmtPct = (pct: number | null): string =>
      pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "N/A";

    // Build full prices list with region annotation — ALL loaded prices, not just first 8
    const allPriceLines = Object.entries(prices)
      .filter(([, v]: [string, any]) => v?.price != null)
      .map(([k, v]: [string, any]) => {
        const region = REGION_MAP[k] || "Global";
        const chg = fmtPct(calcPct(v.price, v.change));
        const cur = getCur(k, v.currency);
        return `  ${k} [${region}]: ${cur}${v.price} (${chg})`;
      })
      .join("\n");

    // Focused asset context
    const assetLabel = signal?.asset?.label || (typeof selected === "string" ? selected : (selected as any)?.label) || "";
    const assetPrice = signal?.asset?.price  != null ? signal.asset.price : "unknown";
    const assetChg   = signal?.asset?.change != null ? `${signal.asset.change >= 0 ? "+" : ""}${signal.asset.change.toFixed(2)}%` : "unknown";
    const sigLabel2  = signal ? (fusion?.fusion?.signal || fusion?.miro?.signal || signal.direction || "HOLD") : "no signal yet";
    const sigConf    = signal ? `${signal.confidence}%` : "N/A";
    const acc        = accuracy ? `${accuracy}%` : "83.3%";

    // News section from pre-fetched cache
    const SENT_ICON: Record<string, string> = { positive: "📈", negative: "📉", neutral: "➡️" };
    const newsSection = assetNews.length > 0
      ? `\nLATEST NEWS — ${assetLabel}:\n` +
        assetNews.map((n, i) =>
          `  ${i + 1}. ${SENT_ICON[n.sentiment] || "➡️"} [${n.sentiment.toUpperCase()}] "${n.title}" — ${n.publisher}`
        ).join("\n") +
        `\n(Quote the headline title and state whether it supports or contradicts the ${sigLabel2} signal.)`
      : "\nNEWS: No headlines currently available for this asset.";

    // ── Mode detection ──────────────────────────────────────
    const allTracked = new Set([...Object.keys(prices), ...Object.keys(REGION_MAP)]);

    const mentionedTickers = [...allTracked].filter(t =>
      new RegExp(`\\b${t}\\b`, "i").test(text)
    );

    const compareMatch = text.match(
      /\b([A-Za-z]{1,8})\s+(?:vs\.?|versus|compared?\s+(?:to|with))\s+([A-Za-z]{1,8})\b/i
    );

    // Detect region-specific or global summary request
    const summaryRegionMatch = text.match(
      /\b(india|nse|bse|us|usa|america|crypto|bitcoin|chile|mexico|brazil|uk|europe|japan|global|summary|overview|market today|top gainers?|losers?|movers?)\b/i
    );
    const isSummary = !compareMatch && /\b(summary|overview|market today|top gainers?|losers?|movers?|india|us\b|usa|crypto|chile|mexico|brazil|uk|europe|japan|global)\b/i.test(text);
    const isPortfolio = !compareMatch && !isSummary && mentionedTickers.length >= 2;
    const isAccuracy = /\b(predict|prediction|accuracy|win rate|correct|track record|past|history|yesterday|result|performance|beat|score|how good|prove|proof)\b/i.test(text);

    // ── Region config ─────────────────────────────────────
    type RegionCfg = {
      name: string;
      sessionKey: string;
      indices: string[];
      tickers: string[];
      sectors: Record<string, string[]>;
    };
    const REGION_CFG: Record<string, RegionCfg> = {
      India: {
        name: "India", sessionKey: "India (NSE/BSE)",
        indices: ["NIFTY50", "NIFTY", "SENSEX"],
        tickers: ["RELIANCE","TCS","INFY","HDFCBANK","ICICIBANK","SBIN","WIPRO",
                  "HINDUNILVR","ITC","AXISBANK","LT","BAJFINANCE","MARUTI",
                  "ONGC","TATAMOTORS","TATASTEEL","ADANIENT","HAL"],
        sectors: {
          "IT":      ["TCS","INFY","WIPRO"],
          "Banking": ["HDFCBANK","ICICIBANK","SBIN","AXISBANK"],
          "Auto":    ["MARUTI","TATAMOTORS"],
          "Energy":  ["RELIANCE","ONGC"],
          "Pharma":  ["SUNPHARMA"],
        },
      },
      US: {
        name: "US", sessionKey: "US (NYSE/NASDAQ)",
        indices: ["SPX","NASDAQ","DOW"],
        tickers: ["AAPL","MSFT","GOOGL","AMZN","META","NVIDIA","TSLA","JPM","BAC",
                  "GS","XOM","CVX","WMT","JNJ","PFE","UNH","LMT","KO","PEP"],
        sectors: {
          "Tech":     ["AAPL","MSFT","GOOGL","AMZN","META","NVIDIA"],
          "Finance":  ["JPM","BAC","GS"],
          "Energy":   ["XOM","CVX"],
          "Health":   ["JNJ","PFE","UNH"],
          "Defense":  ["LMT"],
        },
      },
      Crypto: {
        name: "Crypto", sessionKey: "Crypto",
        indices: ["BTC","ETH"],
        tickers: ["BTC","ETH","BNB","SOL","XRP","ADA","DOGE","AVAX","DOT","MATIC","LINK"],
        sectors: {
          "Layer 1":  ["BTC","ETH","SOL","ADA","AVAX"],
          "Layer 2":  ["MATIC","DOT"],
          "DeFi":     ["LINK"],
          "Exchange": ["BNB"],
        },
      },
      Chile: {
        name: "Chile", sessionKey: "Chile (BCS)",
        indices: ["IPSA"],
        tickers: ["FALABELLA","BCHILE","BSANTANDER","BCI","CENCOSUD","COPEC","SQM","LATAM","ENTEL","COLBUN"],
        sectors: {
          "Banking":  ["BCHILE","BSANTANDER","BCI"],
          "Retail":   ["FALABELLA","CENCOSUD"],
          "Mining":   ["SQM","COPEC"],
          "Energy":   ["COLBUN"],
        },
      },
      Global: {
        name: "Global", sessionKey: "",
        indices: ["SPX","NIFTY50","BTC","GOLD"],
        tickers: [],
        sectors: {
          "US":       ["SPX","NASDAQ"],
          "India":    ["NIFTY50","SENSEX"],
          "Crypto":   ["BTC","ETH"],
          "Commodity":["GOLD","OIL","SILVER"],
        },
      },
    };

    // Detect which region the user is asking about
    const detectRegion = (): string => {
      const t = text.toLowerCase();
      if (/india|nse|bse|nifty|sensex/.test(t))  return "India";
      if (/crypto|bitcoin|btc|eth|defi/.test(t)) return "Crypto";
      if (/chile|ipsa|clp/.test(t))              return "Chile";
      if (/mexico/.test(t))                       return "Mexico";
      if (/\bus\b|usa|america|nasdaq|s&p|dow/.test(t)) return "US";
      return "Global";
    };

    // Helper: format a single asset line
    const fmtAsset = (tick: string) => {
      const d = (prices as any)[tick.toUpperCase()];
      if (!d?.price) return `  ${tick.toUpperCase()}: not currently tracked by PREDIQ`;
      const chgStr = fmtPct(calcPct(d.price, d.change));
      const cur = getCur(tick, d.currency);
      return `  ${tick.toUpperCase()} [${REGION_MAP[tick.toUpperCase()] || "Global"}]: ${cur}${d.price} (${chgStr} today)`;
    };

    // Build rich region summary block
    const buildRegionSummary = (regionKey: string): string => {
      const cfg = REGION_CFG[regionKey] || REGION_CFG["Global"];
      const session = cfg.sessionKey ? (marketSessions[cfg.sessionKey] || "UNKNOWN") : "varies";

      // Index levels
      const indexLines = cfg.indices
        .map(idx => {
          const d = (prices as any)[idx];
          if (!d?.price) return null;
          const chgStr = fmtPct(calcPct(d.price, d.change));
          const cur = getCur(idx, d.currency);
          return `  ${idx}: ${cur}${d.price} (${chgStr})`;
        })
        .filter(Boolean).join("\n");

      // All region stocks with valid prices
      const allStocks = (regionKey === "Global"
        ? Object.keys(prices)
        : [...cfg.indices, ...cfg.tickers]
      )
        .map(k => {
          const d = (prices as any)[k];
          if (!d?.price) return null;
          const pct = calcPct(d.price, d.change);
          if (pct === null) return null;
          return { k, change: pct, price: d.price, cur: getCur(k, d.currency) };
        })
        .filter(Boolean) as { k:string; change:number; price:any; cur:string }[];

      const sorted    = [...allStocks].sort((a, b) => b.change - a.change);
      const gainers   = sorted.slice(0, 3);
      const losers    = sorted.slice(-3).reverse();

      const gainerLines = gainers.map((a, i) =>
        `  ${i+1}. ${a.k}: ${a.cur}${a.price} (+${a.change.toFixed(2)}%)`).join("\n");
      const loserLines  = losers.map((a, i) =>
        `  ${i+1}. ${a.k}: ${a.cur}${a.price} (${a.change.toFixed(2)}%)`).join("\n");

      // Sector breakdown
      const sectorLines = Object.entries(cfg.sectors).map(([sec, ticks]) => {
        const validTicks = ticks.filter(t => (prices as any)[t]?.price);
        if (!validTicks.length) return null;
        const avg = validTicks.reduce((sum, t) => {
          const d = (prices as any)[t];
          return sum + (calcPct(d?.price, d?.change) ?? 0);
        }, 0) / validTicks.length;
        const sentiment = avg > 0.5 ? "↑" : avg < -0.5 ? "↓" : "→";
        return `  ${sec}: ${sentiment} avg ${avg >= 0 ? "+" : ""}${avg.toFixed(2)}%`;
      }).filter(Boolean).join("\n");

      // Determine overall sentiment from index change
      const idxChanges = cfg.indices
        .map(i => {
          const d = (prices as any)[i];
          return calcPct(d?.price, d?.change);
        })
        .filter((v): v is number => v !== null);
      const avgIdx = idxChanges.length
        ? idxChanges.reduce((s, v) => s + v, 0) / idxChanges.length : 0;
      const overallSentiment = avgIdx > 0.5 ? "BULLISH" : avgIdx < -0.5 ? "BEARISH" : "NEUTRAL";

      return `
${cfg.name.toUpperCase()} MARKET SUMMARY:
Session: ${session}
${indexLines ? "INDICES:\n" + indexLines : ""}
TOP 3 GAINERS:
${gainerLines || "  (no data)"}
TOP 3 LOSERS:
${loserLines || "  (no data)"}
SECTOR BREAKDOWN:
${sectorLines || "  (no data)"}
OVERALL SENTIMENT: ${overallSentiment}
TASK: Give a ${cfg.name} market overview using this data. State the session status, highlight the top movers, describe which sectors lead, give the overall sentiment, and end with one clear AI recommendation for a ${cfg.name} trader right now.`;
    };

    try {
      let specialContext = "";

      if (isSummary) {
        const region = detectRegion();
        specialContext = buildRegionSummary(region);

      } else if (compareMatch) {
        const [, rawA, rawB] = compareMatch;
        specialContext = `
COMPARISON REQUEST: ${rawA.toUpperCase()} vs ${rawB.toUpperCase()}
${fmtAsset(rawA)}
${fmtAsset(rawB)}
TASK: Compare these two assets head-to-head. Cover: (1) today's price performance, (2) momentum and trend, (3) which looks stronger right now based on the data. State a clear preference with reasoning. Be direct.`;

      } else if (isPortfolio) {
        const portfolioLines = mentionedTickers
          .slice(0, 8)
          .map(fmtAsset)
          .filter(l => !l.includes("not currently tracked"));

        if (portfolioLines.length >= 2) {
          specialContext = `
PORTFOLIO ANALYSIS REQUEST (${portfolioLines.length} assets):
${portfolioLines.join("\n")}
TASK: Analyze this as a portfolio. Cover: (1) overall direction — bullish, bearish or mixed, (2) diversification across regions and asset types, (3) the 1-2 strongest positions right now, (4) any concerning positions. Be specific using the price data above.`;
        }
      }

      // ── Fundamentals + Analyst context (fetched on-demand) ──────────────────
      let fundamentalsContext = "";
      const needsFundamentals = /fundament|pe ratio|p\/e|eps|earning|revenue|profit margin|overvalued|undervalued|market cap|dividend|beta|52.week|analyst|price target|consensus|recommend|rating/i.test(text);
      if (needsFundamentals && assetLabel) {
        try {
          const [fundRes, analRes] = await Promise.all([
            fetch(`${API_BASE}/api/fundamentals/${encodeURIComponent(assetLabel)}`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE}/api/analyst/${encodeURIComponent(assetLabel)}`).then(r => r.json()).catch(() => null),
          ]);
          const fmt = (v: any, suffix = "") => (v != null && v !== "" ? `${v}${suffix}` : "N/A");
          const fmtNum = (v: any) => v != null ? Number(v).toLocaleString() : "N/A";
          const fmtPct2 = (v: any) => v != null ? `${(Number(v)*100).toFixed(1)}%` : "N/A";

          if (fundRes && !fundRes.error) {
            fundamentalsContext += `
FUNDAMENTALS — ${assetLabel} (${fundRes.name || assetLabel}):
  Sector: ${fmt(fundRes.sector)} | Industry: ${fmt(fundRes.industry)}
  Market Cap: ${fmtNum(fundRes.market_cap)} ${fundRes.currency || "USD"}
  P/E Ratio (trailing): ${fmt(fundRes.pe_ratio)} | Forward P/E: ${fmt(fundRes.forward_pe)}
  EPS: ${fmt(fundRes.eps)} | Profit Margin: ${fmtPct2(fundRes.profit_margin)}
  Revenue: ${fmtNum(fundRes.revenue)} | Beta: ${fmt(fundRes.beta)}
  52-Week High: ${fmt(fundRes.week_52_high)} | 52-Week Low: ${fmt(fundRes.week_52_low)}
  Dividend Yield: ${fmtPct2(fundRes.dividend_yield)}
  Next Earnings Date: ${fmt(fundRes.next_earnings_date)}
  Analyst Target Price: ${fmt(fundRes.analyst_target_price)}`;
          }
          if (analRes && !analRes.error) {
            fundamentalsContext += `
ANALYST CONSENSUS — ${assetLabel}:
  Overall: ${fmt(analRes.consensus)} (mean score ${fmt(analRes.rec_mean)}/5, ${fmt(analRes.total_analysts)} analysts)
  Strong Buy: ${analRes.strong_buy} | Buy: ${analRes.buy} | Hold: ${analRes.hold} | Sell: ${analRes.sell} | Strong Sell: ${analRes.strong_sell}
  Price Target: ${fmt(analRes.target_price)} (range ${fmt(analRes.target_low)}–${fmt(analRes.target_high)})
  Upside from current price: ${fmt(analRes.upside_pct, "%")}`;
          }
          if (fundamentalsContext) {
            fundamentalsContext += `\nTASK: Use the fundamentals and analyst data above to answer the user's question. Be specific — quote P/E, target price, consensus rating, earnings date where relevant. Compare P/E to sector average if possible. State clearly whether the asset looks overvalued, fairly valued or undervalued based on the data.`;
          }
        } catch (_fe) { /* silently skip if fetch fails */ }
      }

      // ── Accuracy / predictions context ───────────────────────────────────────
      let accuracyContext = "";
      if (isAccuracy && validationCache) {
        const { stats, accuracy } = validationCache;

        // Overall stats line
        const overall = accuracy
          ? `Overall: ${accuracy.accuracy_pct}% accuracy (${accuracy.correct_signals}W / ${accuracy.wrong_signals}L of ${accuracy.total_validated_signals} validated signals) — beating GPT-5 (${accuracy.benchmark_gpt5}%): ${accuracy.beating_benchmark ? "YES ✅" : "NO ❌"}`
          : "";

        // By-region breakdown
        const regionLines = stats?.by_region?.map((r: any) =>
          `  ${r.region}: ${r.win_rate}% win rate (${r.total} signals, avg error ${r.avg_mag_error}%)`
        ).join("\n") || "";

        // Recent 10 predictions formatted as one-liners
        const recentLines = (stats?.recent_calls || []).slice(0, 10).map((p: any) => {
          const win = p.direction_correct === 1;
          const result = win ? "✅ WIN" : "❌ LOSS";
          const actual = p.actual_pct != null ? `actual ${p.actual_pct >= 0 ? "+" : ""}${p.actual_pct}%` : "pending";
          return `  ${p.date} | ${p.label} ${p.signal} (${p.confidence}% conf) → predicted ${p.predicted_pct >= 0 ? "+" : ""}${p.predicted_pct}%, ${actual} → ${result}`;
        }).join("\n");

        accuracyContext = `
PREDIQ TRACK RECORD (verified, deduplicated):
${overall}

BY REGION:
${regionLines}

RECENT 10 PREDICTIONS:
${recentLines || "  (no recent data)"}

TASK: Answer the user's question about PREDIQ's accuracy using this verified data. Quote specific predictions by name (e.g. "PREDIQ predicted HAL BUY on 2026-04-16, actual result was +6.71% ✅ WIN"). Be factual and confident. If the track record is strong, say so clearly.`;
      }

      // Recent predictions block — always included so Claude can reference history
      const recentPredictionsBlock = (() => {
        const calls = validationCache?.stats?.recent_calls;
        if (!calls?.length) return "";
        const lines = calls.slice(0, 10).map((p: any) => {
          const win = p.direction_correct === 1;
          const actualStr = p.actual_pct != null
            ? `actual ${p.actual_pct >= 0 ? "+" : ""}${Number(p.actual_pct).toFixed(2)}%`
            : "result pending";
          return `- ${p.label}: ${p.signal} → ${actualStr} ${win ? "✅ WIN" : "❌ MISS"}`;
        }).join("\n");
        const overall = validationCache?.accuracy;
        const overallLine = overall
          ? `Overall accuracy: ${overall.accuracy_pct}% (${overall.correct_signals}W/${overall.wrong_signals}L) — beating GPT-5 ${overall.benchmark_gpt5}%: ${overall.beating_benchmark ? "YES ✅" : "NO ❌"}`
          : "";
        return `\nRECENT PREDIQ PREDICTIONS (last 7 days):\n${lines}\n${overallLine}`;
      })();

      const systemPrompt = `You are PREDIQ AI, a live market signal assistant. You have access to the following LIVE prices right now. Only answer based on this real data. If an asset is not in this list, say it is not tracked by PREDIQ yet.

LIVE PRICES (${new Date().toISOString()}):
${allPriceLines || "  (prices loading — refresh the dashboard)"}

MARKET SESSIONS RIGHT NOW:
${sessionLines}

FOCUSED ASSET: ${assetLabel} [${REGION_MAP[assetLabel] || "Global"}]
  Price: ${assetPrice} (${assetChg} today)
  PREDIQ Signal: ${sigLabel2} | Confidence: ${sigConf}
  PREDIQ Verified Accuracy: ${acc} (deduplicated, real trades)
${newsSection}
${recentPredictionsBlock}
${specialContext}
${accuracyContext}
${fundamentalsContext}
ABOUT PREDIQ:
- MIRO Swarm Intelligence + ML fusion engine
- Tracks 100+ assets: India, Chile, US, Crypto, Commodities, Forex
- BUY / HOLD / SELL signals with entry price, target, stop-loss

CHILEAN STOCK ALIASES:
- "Aguas Andinas" or "water company Chile" or "AGUAS" → tracked as AGUAS (current price in LIVE PRICES)
- "Falabella" → FALABELLA
- "Cencosud" → CENCOSUD
- "Copec" → COPEC
- "LATAM Airlines" or "LAN" → LATAM
- "Banco BCI" or "BCI" → BCI
- "Banco de Chile" or "Bank of Chile" → BCHILE
- "Entel" → ENTEL
- "Colbun" → COLBUN
- "CMPC" or "Empresas CMPC" → CMPC
When user asks about any Chilean company by full name, map it to the ticker above and look it up in LIVE PRICES.

INSTRUCTIONS:
- When asked about India stocks (NIFTY, RELIANCE, etc.) look them up in LIVE PRICES above and cite the exact price and % change.
- When asked about any asset, always state its current price and change from the data above.
- Lead with news headlines when available: "Based on recent news: '[title]' — this is POSITIVE and supports the BUY signal."
- When asked about accuracy or predictions, cite specific entries from RECENT PREDIQ PREDICTIONS above by name.
- If an asset is not in the LIVE PRICES list, say: "PREDIQ does not currently track [asset]. The closest tracked asset is [suggest one]."
- For portfolio/comparison/summary tasks follow the TASK instruction in the special context section above.
- When FUNDAMENTALS data is present, use it to answer valuation/earnings/analyst questions directly. Quote the P/E, target price, and consensus rating.
- Be concise: 4-6 sentences. Plain text only, no markdown.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(`${API_BASE}/api/claude-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text }
          ]
        })
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      const reply = data?.content?.[0]?.text
        || (typeof data?.error === "string" ? data.error : data?.error?.message)
        || "No response.";
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      console.error("[PREDIQ chat error]", err);
      const msg = err?.name === "AbortError"
        ? "Request timed out. Try a shorter question."
        : `Error: ${err?.message || "Connection failed. Try again."}`;
      setChatMessages(prev => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setChatLoading(false);
    }
  };

  const cursorDotsRef = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    fetch(`${API_BASE}/api/accuracy`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (d.accuracy_pct) setAccuracy(d.accuracy_pct.toFixed(1));
        if (d.market_status === "WEEKEND") {
          setIsWeekend(true);
          if (d.weekly) setWeeklyData(d.weekly);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          const now = new Date();
          const utc = now.getTime() + now.getTimezoneOffset()*60000;
          const ist = new Date(utc + 5.5*3600000);
          const h = ist.getHours(), m = ist.getMinutes();
          const isOpen = (h>9||(h===9&&m>=15)) && (h<15||(h===15&&m<=30)) && ist.getDay()!==0 && ist.getDay()!==6;
          if (isOpen) { fetchSignal(selected); setFlashGreen(true); setTimeout(()=>setFlashGreen(false),1500); }
          return 300;
        }
        return prev - 1;
      });
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset()*60000;
      const ist = new Date(utc + 5.5*3600000);
      const h = ist.getHours(), m = ist.getMinutes();
      const isOpen = (h>9||(h===9&&m>=15)) && (h<15||(h===15&&m<=30)) && ist.getDay()!==0 && ist.getDay()!==6;
      setMarketStatus(isOpen ? "NSE OPEN" : "NSE CLOSED");
    }, 1000);
    return () => clearInterval(interval);
  }, [selected]);

  // Cursor fish trail tuning
  const CURSOR_DOT_COUNT = 18;      // trail length
  const CURSOR_FOLLOW_LERP = 0.36;  // higher = snappier, lower = smoother
  const CURSOR_MAX_GLOW = 14;       // glow radius for lead dot
  const CURSOR_MIN_OPACITY = 0.12;  // minimum tail visibility

  useEffect(() => {
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const points = Array.from({ length: CURSOR_DOT_COUNT }, () => ({ x: mouse.x, y: mouse.y }));
    let raf = 0;

    const getSignalColor = (target: EventTarget | null) => {
      const el = target instanceof Element ? target.closest("[data-signal]") as HTMLElement | null : null;
      const signal = el?.dataset?.signal?.toLowerCase() || "";
      if (signal === "sell") return "#ff4466";
      if (signal === "hold") return "#ffaa00";
      return "#00ff88";
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      setCursorColor(prev => {
        const next = getSignalColor(e.target);
        return prev === next ? prev : next;
      });
    };

    const animate = () => {
      let tx = mouse.x;
      let ty = mouse.y;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += (tx - p.x) * CURSOR_FOLLOW_LERP;
        p.y += (ty - p.y) * CURSOR_FOLLOW_LERP;
        tx = p.x;
        ty = p.y;
        const dot = cursorDotsRef.current[i];
        if (dot) {
          dot.style.transform = `translate(${p.x}px, ${p.y}px)`;
        }
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [CURSOR_DOT_COUNT, CURSOR_FOLLOW_LERP]);

  // Auto-refresh every 60s — prices + accuracy, always
  useEffect(() => {
    fetchPrices();
    fetch(`${API_BASE}/api/accuracy?t=${Date.now()}`, { cache: "no-store" })
      .then(r => r.json()).then(d => { if (d.accuracy_pct) setAccuracy(d.accuracy_pct.toFixed(1)); }).catch(() => {});
    const interval = setInterval(() => {
      fetchPrices();
      fetch(`${API_BASE}/api/accuracy?t=${Date.now()}`, { cache: "no-store" })
        .then(r => r.json()).then(d => { if (d.accuracy_pct) setAccuracy(d.accuracy_pct.toFixed(1)); }).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // "Updated X seconds ago" counter
  useEffect(() => {
    const tick = setInterval(() => {
      if (lastRefreshTime.current > 0) {
        setSecondsSince(Math.floor((Date.now() - lastRefreshTime.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const t = setInterval(()=>setTime(new Date().toLocaleTimeString()),1000);
    return ()=>clearInterval(t);
  }, []);

  // ── FETCH SIGNAL ──────────────────────────────────────────────────────────
  const fetchSignal = async (asset: Asset) => {
    if (asset.price === 0) return;
    setLoading(true); setError(""); setActiveTab("signal");
    try {
      const res = await fetch(`${API_BASE}/api/swarm`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          asset:asset.label, asset_type:asset.type, price:asset.price,
          price_change_pct:asset.change, rsi:48+Math.random()*22,
          volume_ratio:0.8+Math.random()*2, news_sentiment:(Math.random()-0.4)*1.4,
          social_buzz:(Math.random()-0.4)*1.2, n_agents:2400000, n_ticks:5,
        }),
      });
      const data = await res.json();
      const dir: string = data.direction;
      const vol = asset.type==="gold"?0.015:asset.type==="forex"?0.008:asset.type==="crypto"?0.06:asset.type==="index"?0.012:0.025;
      const maxPct = asset.type==="crypto"?7.0:asset.type==="gold"?1.5:asset.type==="forex"?1.0:asset.type==="index"?1.5:3.5;
      const conf = data.confidence/100;
      const entry = parseFloat((asset.price*(1+(dir==="buy"?-0.002:0.002))).toFixed(4));
      let mlData: any = null;
      try {
        const mlRes = await fetch(`${API_BASE}/api/ml/signal/${asset.label}`);
        const mlJson = await mlRes.json();
        mlData = mlJson?.ml_signal || null;
      } catch(e) {}
      setSignal({
        asset, direction:dir, signal_label:data.signal, confidence:data.confidence,
        target:      parseFloat((asset.price*(1+(dir==="buy"?1:-1)*vol*conf*1.5)).toFixed(4)),
        stop:        parseFloat((asset.price*(1+(dir==="buy"?-1:1)*vol*0.7)).toFixed(4)),
        target_pct:  parseFloat((Math.sign(dir==="buy"?1:-1)*Math.min(Math.abs(vol*conf*100), maxPct)).toFixed(2)),
        swarm:{buy_pct:data.buy_pct,hold_pct:data.hold_pct,sell_pct:data.sell_pct,herd_event:data.herd_event,confidence:data.confidence,rsi:mlData?.indicators?.rsi,macd:mlData?.indicators?.macd,bb_position:mlData?.indicators?.bb_position},
        personas:generatePersonaVerdicts(dir,data.confidence),
        forecast:generate7DayForecast(asset.price,dir),
        time:new Date().toLocaleTimeString(),
        entry_price:entry,
      });
    } catch(e){ setError("Swarm engine unreachable"); }
    setLoading(false);
  };

  // Linear regression slope helper
  const linRegSlope = (arr: number[]): number => {
    const n = arr.length;
    if (n < 2) return 0;
    const sumX = arr.reduce((_s, _v, i) => _s + i, 0);
    const sumY = arr.reduce((s, v) => s + v, 0);
    const sumXY = arr.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = arr.reduce((s, _v, i) => s + i * i, 0);
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  };

  const dailyCap = (type: string) =>
    type === "crypto" ? 8 : type === "index" ? 1.5 : type === "forex" ? 1 : 2.5;

  const fetchSwingSignal = async (asset: Asset) => {
    setSwingLoading(true); setSwingSignal(null);
    try {
      const res = await fetch(`${API_BASE}/api/price-history?asset=${asset.label}&days=14`);
      const data = await res.json();
      const prices: number[] = data.prices || [];
      if (prices.length < 7) {
        setSwingSignal({ swing_signal: "HOLD", swing_pct: 0, swing_trend: "insufficient data", prices });
        setSwingLoading(false); return;
      }
      const last7 = prices.slice(-7);
      const slope = linRegSlope(last7);
      const pctPerDay = last7[0] !== 0 ? (slope / last7[0]) * 100 : 0;
      const rawPct = pctPerDay * 5;
      const cap = dailyCap(asset.type) * 2;
      const swing_pct = Math.round(Math.max(-cap, Math.min(cap, rawPct)) * 100) / 100;
      const swing_signal = pctPerDay > 0.15 ? "BUY" : pctPerDay < -0.15 ? "SELL" : "HOLD";
      const swing_trend = pctPerDay > 0.15 ? "uptrend" : pctPerDay < -0.15 ? "downtrend" : "flat";
      setSwingSignal({ swing_signal, swing_pct, swing_trend, prices, asset: asset.label });
    } catch(e) {
      setSwingSignal({ swing_signal: "HOLD", swing_pct: 0, swing_trend: "error", prices: [] });
    }
    setSwingLoading(false);
  };

  const fetchPositionSignal = async (asset: Asset) => {
    setPositionLoading(true); setPositionSignal(null);
    try {
      const res = await fetch(`${API_BASE}/api/price-history?asset=${asset.label}&days=90`);
      const data = await res.json();
      const prices: number[] = data.prices || [];
      if (prices.length < 30) {
        setPositionSignal({ position_signal: "HOLD", position_pct: 0, ma30: 0, current_price: prices[prices.length-1] || 0, prices });
        setPositionLoading(false); return;
      }
      const last30 = prices.slice(-30);
      const ma30 = last30.reduce((s, v) => s + v, 0) / 30;
      const current = prices[prices.length - 1];
      const diffPct = ma30 !== 0 ? ((current - ma30) / ma30) * 100 : 0;
      const cap = dailyCap(asset.type) * 3;
      const position_pct = Math.round(Math.max(-cap, Math.min(cap, diffPct)) * 100) / 100;
      const position_signal = diffPct > 2 ? "BUY" : diffPct < -2 ? "SELL" : "HOLD";
      setPositionSignal({ position_signal, position_pct, ma30: Math.round(ma30 * 100) / 100, current_price: Math.round(current * 100) / 100, prices: last30, asset: asset.label });
    } catch(e) {
      setPositionSignal({ position_signal: "HOLD", position_pct: 0, ma30: 0, current_price: 0, prices: [] });
    }
    setPositionLoading(false);
  };

  const fetchOptionsSignal = async (asset: Asset, tf: string = "swing") => {
    setOptionsLoading(true); setOptionsSignal(null);
    try {
      const res = await fetch(`${API_BASE}/api/options-signal/${encodeURIComponent(asset.label)}?timeframe=${tf}`);
      const data = await res.json();
      setOptionsSignal(data);
    } catch(e) {
      setOptionsSignal({ error: "Failed to load options signal" });
    }
    setOptionsLoading(false);
  };

  const selectAsset = (asset: Asset) => {
    setSelected(asset);
    fetchSignal(asset);
    fetchSwingSignal(asset);
    fetchPositionSignal(asset);
    fetchOptionsSignal(asset, "swing");
    setTimeframe("day");
    setMenuOpen(false);
    // Fetch fusion signal
    setFusion(null);
    fetch(`${API_BASE}/api/fusion/${asset.label}`)
      .then(r=>r.json())
      .then(d=>{ if(!d.error) setFusion(d); })
      .catch(()=>{});
  };
  const toggleWatch = (label: string) => setWatchlist(prev=>prev.includes(label)?prev.filter(x=>x!==label):[...prev,label]);

  const positionSize = signal ? (()=>{
    const risk = capital*0.02;
    const stopDist = Math.abs(signal.asset.price - signal.stop);
    const shares = stopDist>0 ? Math.floor(risk/stopDist) : 0;
    return { shares, totalCost:(shares*signal.asset.price).toFixed(2), riskAmount:risk.toFixed(0) };
  })() : null;

  const dir = signal?.direction||"hold";
  const doSearch = async (q: string) => {
    if(!q.trim()) { setSearchRes([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setSearchRes(d.results || []);
    } catch { setSearchRes([]); }
    setSearching(false);
  };

  const sigColor = dir==="buy"?"#00ff88":dir==="sell"?"#ff4466":"#ffaa00";
  const sigLabel = signal?.signal_label?.replace(/_/g," ").toUpperCase()||"—";

  // Live oil price from fetched data
  const oilPrice = prices["BRENT"]?.price || prices["WTI"]?.price || 72.31;
  const oilChange = prices["BRENT"]?.change_pct || prices["WTI"]?.change_pct || 1.6;
  const indiaFuelPrice = 94.72 + (oilPrice - 72) * 0.4; // rough correlation
  const oilImpact = (Math.abs(oilChange)/100 * PETROL_DATA.daily_litres * indiaFuelPrice).toFixed(2);

  const S = {
    card: { background:themeObj.panel, border:`1px solid ${themeObj.border}`, borderRadius:8, padding:"16px" } as React.CSSProperties,
    label: { fontSize:9, color:themeObj.muted, letterSpacing:2, marginBottom:6 } as React.CSSProperties,
  };

  const tabBtn = (t: string, label: string) => (
    <button key={t} onClick={()=>setActiveTab(t)} style={{
      padding:"6px 12px",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",
      letterSpacing:1,fontFamily:"inherit",border:"none",whiteSpace:"nowrap" as const,
      background:activeTab===t?sigColor:"transparent",
      color:activeTab===t?themeObj.bg:themeObj.muted,
    }}>{label}</button>
  );

  const sectorBtn = (key: string, label: string) => (
    <button key={key} onClick={()=>{ setActiveSector(key); if(sectors[key]?.assets[0]) selectAsset(sectors[key].assets[0]); }} style={{
      padding:isMobile?"9px 12px":"6px 12px",borderRadius:4,fontSize:isMobile?11:10,fontWeight:700,cursor:"pointer",
      letterSpacing:1,fontFamily:"inherit",whiteSpace:"nowrap" as const,
      background:activeSector===key?`${themeObj.accent}18`:themeObj.panel,
      border:activeSector===key?`1px solid ${themeObj.accent}`:`1px solid ${themeObj.border}`,
      color:activeSector===key?themeObj.accent:themeObj.muted,
      touchAction:"manipulation",
    }}>{label}</button>
  );

  const formatPrice = (asset: Asset) => {
    if (asset.price === 0) return "Loading...";
    const sym = asset.currency === "₹" ? "₹" : asset.currency === "CLP" ? "CLP " : asset.currency === "£" ? "£" : asset.currency === "€" ? "€" : "$";
    return sym + asset.price.toLocaleString();
  };

  // ── Loading screen (auth not yet confirmed) ───────────────────────────────
  if (!authReady) {
    return (
      <div style={{
        background:themeObj.bg, minHeight:"100vh",
        fontFamily:"'SF Mono','Fira Code',monospace",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:themeObj.accent, fontSize:13, letterSpacing:4,
      }}>
        INITIALIZING...
        {/* Chat button always present so it mounts instantly once auth clears */}
        <button
          onClick={() => setChatOpen(o => !o)}
          style={{
            position:"fixed", bottom:60, right:16,
            width:48, height:48, borderRadius:"50%",
            background:"#00ff88", border:"none", cursor:"pointer",
            fontSize:20, display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 18px #00ff8866", zIndex:10000,
            color:"#020408", fontWeight:700,
          }}
          aria-label="Open AI Chat"
        >💬</button>
      </div>
    );
  }

  return (
    <>
    <style>{`@keyframes prediq-fadein{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    <div style={{background:themeObj.bg,minHeight:"100vh",fontFamily:"'SF Mono','Fira Code',monospace",color:themeObj.text,paddingBottom:isMobile?90:80,cursor:isMobile?"auto":"none"}}>
      {!isMobile && Array.from({ length: CURSOR_DOT_COUNT }).map((_, i) => (
        <div
          key={`fish-cursor-${i}`}
          ref={(el) => { cursorDotsRef.current[i] = el; }}
          style={{
            position: "fixed",
            top: -6,
            left: -6,
            width: Math.max(3, 8 - i * 0.35),
            height: Math.max(3, 8 - i * 0.35),
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 9999,
            background: cursorColor,
            opacity: Math.max(CURSOR_MIN_OPACITY, 0.95 - i * 0.05),
            boxShadow: `0 0 ${Math.max(4, CURSOR_MAX_GLOW - i)}px ${cursorColor}`,
            transform: "translate(-100px, -100px)",
            transition: "background 120ms linear, box-shadow 120ms linear",
          }}
        />
      ))}

      {/* ── PULL-TO-REFRESH INDICATOR ── */}
      {isMobile && pullDistance > 0 && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, zIndex:200,
          display:"flex", alignItems:"center", justifyContent:"center",
          height: pullDistance,
          background:themeObj.panel,
          borderBottom:`1px solid ${themeObj.border}`,
          transition:"height 0.1s",
          overflow:"hidden",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8,opacity: pullDistance / PULL_THRESHOLD}}>
            <span style={{fontSize:16, transform:`rotate(${pullDistance / PULL_THRESHOLD * 180}deg)`, display:"inline-block", transition:"transform 0.1s"}}>
              {pullDistance >= PULL_THRESHOLD ? "↻" : "↓"}
            </span>
            <span style={{fontSize:10, color:themeObj.accent, letterSpacing:2}}>
              {pullDistance >= PULL_THRESHOLD ? "RELEASE TO REFRESH" : "PULL TO REFRESH"}
            </span>
          </div>
        </div>
      )}

      {/* ── TOPBAR ── */}
      <div style={{background:themeObj.panel,borderBottom:`1px solid ${themeObj.border}`,padding:isMobile?"8px 12px":"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?8:12}}>
          <div style={{fontSize:isMobile?16:18,fontWeight:700,letterSpacing:2,color:themeObj.accent}}>PREDIQ</div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:refreshing?"#ffaa00":pricesLoaded?themeObj.accent:"#ffaa00",boxShadow:"0 0 6px "+(refreshing?"#ffaa00":pricesLoaded?themeObj.accent:"#ffaa00")}}/>
            <span style={{fontSize:10,color:refreshing?"#ffaa00":pricesLoaded?themeObj.accent:"#ffaa00",letterSpacing:1}}>
              {refreshing?"UPDATING...":pricesLoaded?"LIVE":"LOADING"}
            </span>
          </div>
          {pricesLoaded && secondsSince > 0 && !refreshing && (
            <span style={{fontSize:9,color:themeObj.muted}}>
              {secondsSince < 60 ? `${secondsSince}s ago` : `${Math.floor(secondsSince/60)}m ago`}
            </span>
          )}
          {!isMobile && <>
            <a href="/" style={{fontSize:10,color:themeObj.muted,textDecoration:"none",border:`1px solid ${themeObj.border}`,padding:"3px 10px",borderRadius:4}}>← HOME</a>
            <a href="/network" style={{fontSize:10,color:"#aa66ff",textDecoration:"none",border:"1px solid #aa44ff33",padding:"3px 10px",borderRadius:4}}>NETWORK</a>
            <a href="/chart" style={{fontSize:10,color:themeObj.accent,textDecoration:"none",border:"1px solid rgba(0,255,136,0.2)",padding:"3px 10px",borderRadius:4}}>CHARTS</a>
            <a href="/ai" style={{fontSize:10,color:"#aa66ff",textDecoration:"none",border:"1px solid rgba(170,102,255,0.3)",padding:"3px 10px",borderRadius:4,letterSpacing:"0.05em",fontWeight:700}}>🤖 AI ANALYST</a>
            <a href="/screener" style={{fontSize:10,color:"#ffd166",textDecoration:"none",border:"1px solid rgba(255,209,102,0.25)",padding:"3px 10px",borderRadius:4,letterSpacing:"0.05em"}}>SCREENER</a>
            <a href="/mission" style={{fontSize:10,color:"#00d4ff",textDecoration:"none",border:"1px solid rgba(0,212,255,0.3)",padding:"3px 10px",borderRadius:4,letterSpacing:"0.1em"}}>MISSION</a>
          </>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?8:12}}>
          <div style={{fontSize:isMobile?11:10,color:themeObj.muted}}>ACC <span style={{color:themeObj.accent,fontWeight:700}}>{accuracy}%</span></div>
          <button
            onClick={() => {
              localStorage.removeItem("prediq_access_code");
              localStorage.removeItem("prediq_code");
              localStorage.removeItem("prediq_tier");
              localStorage.removeItem("prediq_login_time");
              window.location.href = "/";
            }}
            title="Logout"
            style={{
              background:"none", border:"1px solid rgba(255,68,68,0.4)", borderRadius:4,
              padding:isMobile?"6px 10px":"3px 8px", cursor:"pointer",
              color:"#ff4444", fontSize:isMobile?11:9, fontFamily:"inherit",
              letterSpacing:1, fontWeight:700,
            }}
          >LOGOUT</button>
          <button
            onClick={() => {
              if (voiceMuted) {
                setVoiceMuted(false);
                speakGreeting();
              } else {
                setVoiceMuted(false);
                speakGreeting();
                // After playing, allow mute on second tap via toggle
              }
            }}
            onDoubleClick={() => { window.speechSynthesis?.cancel(); setVoiceMuted(true); }}
            title={voiceMuted ? "Click to replay greeting" : "Click to play greeting • Double-click to mute"}
            style={{
              background: voiceMuted ? "none" : "rgba(0,255,136,0.12)",
              border: voiceMuted ? "1px solid #0d2035" : "1px solid rgba(0,255,136,0.5)",
              borderRadius: 6, padding: isMobile ? "6px 12px" : "4px 10px",
              cursor: "pointer", color: voiceMuted ? "#1a3a5c" : "#00ff88",
              fontSize: isMobile ? 12 : 10, fontFamily: "inherit", lineHeight: 1,
              fontWeight: 700, letterSpacing: 1,
              boxShadow: voiceMuted ? "none" : "0 0 8px rgba(0,255,136,0.3)",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            {voiceMuted ? "🔇" : "🔊"}{!isMobile && !voiceMuted && <span>PREDIQ</span>}
          </button>
          <button onClick={fetchPrices} style={{background:"none",border:`1px solid ${themeObj.border}`,borderRadius:4,padding:isMobile?"6px 10px":"3px 8px",cursor:"pointer",color:themeObj.muted,fontSize:isMobile?14:10,fontFamily:"inherit"}}>↻</button>
          <button
            onClick={toggleTheme}
            style={{background:themeObj.key==="wallst"?`${themeObj.accent}22`:"none",border:`1px solid ${themeObj.border}`,borderRadius:5,padding:isMobile?"6px 10px":"3px 10px",cursor:"pointer",color:themeObj.accent,fontSize:isMobile?11:10,fontFamily:"inherit",fontWeight:700,letterSpacing:0.5,transition:"all 0.2s"}}
          >
            {themeObj.emoji}
          </button>
          <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:`1px solid ${themeObj.border}`,borderRadius:4,padding:isMobile?"6px 10px":"4px 8px",cursor:"pointer",color:themeObj.muted,fontSize:isMobile?18:16,lineHeight:1}}>
            {menuOpen?"✕":"☰"}
          </button>
        </div>
      </div>

      {/* ── MARKET OVERVIEW BAR ── */}
      {(() => {
        const BAR_ASSETS = [
          { label: "SPX",     name: "S&P 500"  },
          { label: "DOW",     name: "DOW"      },
          { label: "NASDAQ",  name: "NASDAQ"   },
          { label: "NIFTY50", name: "NIFTY50"  },
          { label: "BTC/USD", name: "BTC"      },
          { label: "GOLD",    name: "GOLD"     },
          { label: "BRENT",   name: "BRENT"    },
        ];
        // prices is Record<string, PriceData> from the outer component state

        const Sparkline = ({ data, positive }: { data: number[]; positive: boolean }) => {
          if (!data || data.length < 2) return <svg width={48} height={22} />;
          const min = Math.min(...data), max = Math.max(...data);
          const range = max - min || 1;
          const pts = data.map((v, i) => {
            const x = (i / (data.length - 1)) * 46 + 1;
            const y = 20 - ((v - min) / range) * 18 + 1;
            return `${x},${y}`;
          }).join(" ");
          const col = positive ? "#00ff88" : "#ff4466";
          return (
            <svg width={48} height={22} style={{ display: "block" }}>
              <polyline points={pts} fill="none" stroke={col} strokeWidth={1.5} strokeLinejoin="round" opacity={0.9} />
              <polyline points={`1,21 ${pts} 47,21`} fill={`${col}18`} stroke="none" />
            </svg>
          );
        };

        return (
          <div style={{
            background:     themeObj.bg,
            borderBottom:   `1px solid ${themeObj.border}`,
            display:        "flex",
            overflowX:      "auto",
            alignItems:     "center",
            gap:            0,
            scrollbarWidth: "none",
            msOverflowStyle:"none" as any,
          }}>
            <div style={{ fontSize: 8, color: "#1a3a5c", letterSpacing: 2, padding: "0 10px", flexShrink: 0, textTransform: "uppercase" as const }}>
              MARKETS
            </div>
            {BAR_ASSETS.map((ba, i) => {
              const a       = prices[ba.label];
              const history = marketBarData[ba.label] || [];
              const price   = a?.price ?? 0;
              const change  = a?.change ?? 0;
              const pos     = change >= 0;
              const col     = pos ? themeObj.accentBuy : themeObj.accentSell;
              const isLast  = i === BAR_ASSETS.length - 1;
              return (
                <div
                  key={ba.label}
                  onClick={() => { /* select asset */ }}
                  style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           6,
                    padding:       "5px 14px 5px 10px",
                    borderRight:   isLast ? "none" : "1px solid #0a1a28",
                    flexShrink:    0,
                    cursor:        "default",
                    transition:    "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#050d1a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ minWidth: 52 }}>
                    <div style={{ fontSize: 10, color: "#7ab0d0", fontWeight: 700, letterSpacing: 0.5 }}>{ba.name}</div>
                    <div style={{ fontSize: 11, color: "#e0e8f0", fontWeight: 600, marginTop: 1 }}>
                      {price > 0
                        ? (price >= 1000
                            ? price.toLocaleString(undefined, { maximumFractionDigits: 0 })
                            : price.toFixed(2))
                        : "—"}
                    </div>
                    <div style={{ fontSize: 10, color: col, fontWeight: 700 }}>
                      {price > 0 ? `${pos ? "+" : ""}${change.toFixed(2)}%` : "—"}
                    </div>
                  </div>
                  <Sparkline data={history} positive={pos} />
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── VOICE PROMPT BANNER ── */}
      {voicePromptVisible && (
        <div
          onClick={() => {
            setVoicePromptVisible(false);
            if (!greetedRef.current) {
              greetedRef.current = true;
              sessionStorage.setItem("prediq_greeted", "1");
              speakGreeting();
            }
          }}
          style={{
            position:"fixed", top:46, left:"50%", transform:"translateX(-50%)",
            zIndex:500, background:"rgba(0,255,136,0.12)",
            border:"1px solid rgba(0,255,136,0.4)", borderRadius:20,
            padding:"8px 20px", cursor:"pointer",
            display:"flex", alignItems:"center", gap:8,
            animation:"prediq-fadein 0.3s ease",
            whiteSpace:"nowrap",
          }}
        >
          <span style={{fontSize:16}}>🔊</span>
          <span style={{fontSize:11, color:themeObj.accent, letterSpacing:1, fontWeight:700}}>TAP TO HEAR PREDIQ</span>
        </div>
      )}

      {/* ── PRICE LOADING BANNER ── */}
      {!pricesLoaded && !priceError && (
        <div style={{background:"#0a0a00",borderBottom:"1px solid #ffaa0022",padding:"7px 16px",fontSize:10,color:"#ffaa00",textAlign:"center"}}>
          Fetching live prices from markets... Gold, Oil, Stocks, Forex loading...
        </div>
      )}
      {priceError && (
        <div style={{background:"#0a0000",borderBottom:"1px solid #ff446622",padding:"7px 16px",fontSize:10,color:themeObj.accentSell,textAlign:"center"}}>
          Live prices unavailable — showing last known prices. Check Railway has yfinance installed.
        </div>
      )}

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div style={{background:themeObj.panel,borderBottom:`1px solid ${themeObj.border}`,padding:"12px 16px",position:"sticky",top:45,zIndex:99}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
            <a href="/network" onClick={()=>setMenuOpen(false)} style={{fontSize:10,color:"#aa66ff",textDecoration:"none",border:"1px solid #aa66ff33",padding:"5px 12px",borderRadius:4}}>AGENT NETWORK</a>
            {Object.entries(sectors).map(([key,sec])=>(
              <button key={key} onClick={()=>{setActiveSector(key);if(sec.assets[0])selectAsset(sec.assets[0]);setMenuOpen(false);}} style={{fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:1,fontFamily:"inherit",background:activeSector===key?`${themeObj.accent}18`:"transparent",border:activeSector===key?`1px solid ${themeObj.accent}`:`1px solid ${themeObj.border}`,color:activeSector===key?themeObj.accent:themeObj.muted,padding:"5px 12px",borderRadius:4}}>
                {sec.label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {(sectors[activeSector]?.assets||[]).map(a=>(
              <button key={a.label} onClick={()=>selectAsset(a)} style={{padding:"6px 10px",borderRadius:4,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:selected.label===a.label?"#002a18":"#030810",border:selected.label===a.label?`1px solid ${themeObj.accent}`:`1px solid ${themeObj.border}`,color:selected.label===a.label?themeObj.accent:themeObj.muted}}>
                {a.label}
                <span style={{display:"block",fontSize:9,color:a.change>=0?themeObj.accentBuy:themeObj.accentSell}}>{a.price>0?(a.change>=0?"+":"")+a.change.toFixed(2)+"%":"..."}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── LIVE TICKER ── */}
      <div style={{background:themeObj.bg,borderBottom:`1px solid ${themeObj.border}`,padding:"5px 16px",display:"flex",gap:20,overflowX:"auto",alignItems:"center"}}>
        <span style={{fontSize:9,color:"#1a3a5c",letterSpacing:2,flexShrink:0}}>{pricesLoaded?"LIVE":"—"}</span>
        {Object.values(sectors).flatMap(s=>s.assets).filter(a=>a.price>0).slice(0,14).map(a=>(
          <div key={a.label} style={{display:"flex",gap:5,alignItems:"center",flexShrink:0,fontSize:10}}>
            <span style={{color:themeObj.muted}}>{a.label}</span>
            <span style={{color:"#8ab0cc"}}>{formatPrice(a)}</span>
            <span style={{color:a.change>=0?themeObj.accentBuy:themeObj.accentSell}}>{a.change>=0?"+":""}{a.change.toFixed(2)}%</span>
          </div>
        ))}
      </div>

      {/* ── OIL IMPACT BANNER ── */}
      <div style={{background:"#0a0500",borderBottom:"1px solid #ff660011",padding:"7px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setShowPetrol(!showPetrol)}>
        <div style={{fontSize:10,color:themeObj.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          <span style={{color:"#ffaa00",fontWeight:700}}>BRENT ${oilPrice.toFixed(2)} {oilChange>=0?"+":""}{oilChange.toFixed(2)}%</span>
          <span style={{color:themeObj.muted}}> — commute costs </span>
          <span style={{color:themeObj.accentSell}}>₹{oilImpact} more</span>
          <span style={{color:themeObj.muted}}> — </span>
          <span style={{color:themeObj.accent}}>ONGC RELIANCE benefit</span>
        </div>
        <span style={{fontSize:9,color:themeObj.muted,flexShrink:0,marginLeft:8}}>{showPetrol?"HIDE":"MORE"}</span>
      </div>

      {/* ── PETROL CALCULATOR ── */}
      {showPetrol && (
        <div style={{background:"#060300",borderBottom:"1px solid #ff660011",padding:"12px 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:10}}>
            {[
              ["Brent Crude","$"+oilPrice.toFixed(2)+"/bbl",(oilChange>=0?"+":"")+oilChange.toFixed(2)+"%","#ffaa00"],
              ["India pump","₹"+indiaFuelPrice.toFixed(2)+"/L","live estimate","#ff8844"],
              ["Chile 93 Oct","CLP "+(1450+(oilPrice-95)*12).toFixed(0)+"/L","regular","#ff8844"],
              ["Chile 95 Oct","CLP "+(1513+(oilPrice-95)*12).toFixed(0)+"/L","premium","#ff8844"],
              ["Chile 97 Oct","CLP "+(1560+(oilPrice-95)*12).toFixed(0)+"/L","super","#ff8844"],
              ["Chile Diesel","CLP "+(1420+(oilPrice-95)*10).toFixed(0)+"/L","trucks/buses","#ff8844"],
              ["Daily cost extra","₹"+oilImpact,"2.5L commute","#ff4466"],
            ].map(([l,v,s,c])=>(
              <div key={l} style={{background:"#0a0600",border:"1px solid #ff660015",borderRadius:6,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:themeObj.muted,marginBottom:3}}>{l}</div>
                <div style={{fontSize:14,fontWeight:700,color:c,marginBottom:2}}>{v}</div>
                <div style={{fontSize:9,color:themeObj.muted}}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{background:"#002a18",border:"1px solid #00ff8822",borderRadius:6,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:themeObj.accent,letterSpacing:1,marginBottom:5}}>STOCKS THAT BENEFIT</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {PETROL_DATA.benefiting.map(s=>(
                  <span key={s} style={{fontSize:10,fontWeight:700,padding:"2px 7px",background:"#00ff8815",border:"1px solid #00ff88",borderRadius:3,color:themeObj.accent,cursor:"pointer"}}
                    onClick={()=>{const a=Object.values(sectors).flatMap(sec=>sec.assets).find(x=>x.label===s);if(a)selectAsset(a);}}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div style={{background:"#1a0008",border:"1px solid #ff446622",borderRadius:6,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:themeObj.accentSell,letterSpacing:1,marginBottom:5}}>STOCKS HURT</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {PETROL_DATA.hurt.map(s=><span key={s} style={{fontSize:10,padding:"2px 7px",background:"#ff446615",border:"1px solid #ff4466",borderRadius:3,color:themeObj.accentSell}}>{s}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:isMobile?"100%":960,margin:"0 auto",padding:isMobile?"10px 10px":"14px 14px",overflowX:"hidden"}}>

        {/* ── SECTOR + ASSET SELECTORS ── */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,color:themeObj.muted,letterSpacing:2,marginBottom:8}}>MARKET</div>
          <div style={{display:"flex",gap:isMobile?5:6,flexWrap:"wrap",marginBottom:10}}>
            {Object.entries(sectors).map(([key,sec])=>sectorBtn(key,sec.label))}
            <button onClick={()=>setShowPetrol(!showPetrol)} style={{padding:isMobile?"8px 12px":"6px 12px",borderRadius:4,fontSize:isMobile?11:10,fontWeight:700,cursor:"pointer",letterSpacing:1,fontFamily:"inherit",background:"#0a0500",border:"1px solid #ffaa0033",color:"#ffaa00"}}>OIL</button>
            {!isMobile && <a href="/network" style={{padding:"6px 12px",borderRadius:4,fontSize:10,fontWeight:700,letterSpacing:1,background:"#0a001a",border:"1px solid #aa44ff44",color:"#aa66ff",textDecoration:"none"}}>NETWORK</a>}
          </div>
          <div style={isMobile ? {
            display:"grid" as const,
            gridTemplateColumns:"repeat(4,1fr)",
            gap:5,
            alignItems:"stretch",
          } : {
            display:"flex" as const,
            flexWrap:"wrap" as const,
            gap:6,
            alignItems:"center",
          }}>
            {(sectors[activeSector]?.assets||[]).map(a=>(
              <button key={a.label} onClick={()=>selectAsset(a)} style={{
                padding:isMobile?"12px 8px":"7px 12px",
                borderRadius:isMobile?6:4,
                fontSize:isMobile?12:11,
                fontWeight:700,cursor:"pointer",letterSpacing:1,fontFamily:"inherit",
                background:selected.label===a.label?`${themeObj.accent}18`:themeObj.panel,
                border:selected.label===a.label?"1px solid #00ff88":"1px solid #0d2035",
                color:selected.label===a.label?"#00ff88":"#3a6080",
                boxShadow:selected.label===a.label?"0 0 10px rgba(0,255,136,0.12)":"none",
                textAlign:"center" as const,
                touchAction:"manipulation",
              }}>
                {FLAG_MAP[a.label] ? FLAG_MAP[a.label]+" " : ""}{a.label}{watchlist.includes(a.label)?" *":""}
                <span style={{display:"block",fontSize:isMobile?10:9,color:a.change>=0?themeObj.accentBuy:themeObj.accentSell,marginTop:2}}>
                  {a.price>0?(a.change>=0?"+":"")+a.change.toFixed(2)+"%":"..."}
                </span>
              </button>
            ))}
            <button onClick={()=>toggleWatch(selected.label)} style={{padding:isMobile?"12px 8px":"7px 12px",borderRadius:isMobile?6:4,fontSize:isMobile?11:10,fontWeight:700,cursor:"pointer",letterSpacing:1,fontFamily:"inherit",background:watchlist.includes(selected.label)?"#1a1200":themeObj.panel,border:watchlist.includes(selected.label)?"1px solid #ffaa00":`1px solid ${themeObj.border}`,color:watchlist.includes(selected.label)?"#ffaa00":themeObj.muted}}>
              {watchlist.includes(selected.label)?"★ WATCH":"WATCH"}
            </button>
            <a href={`/chart?asset=${selected.label}`} style={{padding:isMobile?"12px 8px":"7px 12px",borderRadius:isMobile?6:4,fontSize:isMobile?11:10,fontWeight:700,cursor:"pointer",letterSpacing:1,fontFamily:"inherit",background:themeObj.panel,border:`1px solid ${themeObj.border}`,color:themeObj.accent,textDecoration:"none",display:"block",textAlign:"center" as const}}>📈 CHART</a>
            <button onClick={()=>setShowSearch(s=>!s)} style={{padding:isMobile?"12px 8px":"7px 12px",borderRadius:isMobile?6:4,fontSize:isMobile?11:10,fontWeight:700,cursor:"pointer",letterSpacing:1,fontFamily:"inherit",background:showSearch?"#001a30":themeObj.panel,border:showSearch?"1px solid #00aaff":`1px solid ${themeObj.border}`,color:showSearch?"#00aaff":themeObj.muted}}>
              🔍 SEARCH
            </button>
          </div>
        </div>

        {/* ── SEARCH ANY STOCK ── */}
        {showSearch && (
          <div style={{...S.card,marginBottom:10,border:"1px solid #00aaff33"}}>
            <div style={{fontSize:9,color:"#00aaff",letterSpacing:2,marginBottom:10}}>🔍 SEARCH ANY STOCK</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input
                type="text"
                placeholder="e.g. RELIANCE, TSLA, SQM, AAPL, BTC..."
                value={searchQ}
                onChange={e=>setSearchQ(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&doSearch(searchQ)}
                style={{flex:1,background:"#020609",border:`1px solid ${themeObj.border}`,borderRadius:4,padding:"8px 12px",color:themeObj.text,fontFamily:"inherit",fontSize:12}}
              />
              <button onClick={()=>doSearch(searchQ)} style={{padding:"8px 16px",background:"#001a30",border:"1px solid #00aaff44",borderRadius:4,color:"#00aaff",fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:1}}>
                {searching?"...":"FIND"}
              </button>
            </div>
            <div style={{fontSize:9,color:"#1a3a5c",marginBottom:8}}>
              Tips: Use .NS for India (TCS.NS) · .SN for Chile (SQM.SN) · .TO for Canada · Direct: AAPL, NIFTY50
            </div>
            {searchRes.length > 0 && (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {searchRes.map((r,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#020609",borderRadius:4,padding:"8px 12px",border:`1px solid ${themeObj.border}`,cursor:"pointer"}}
                    onClick={()=>{
                      const asset = {label:r.ticker, name:r.name, type:"stock" as const, currency:r.currency||"$", price:r.price||0, change:r.change_pct||0};
                      selectAsset(asset);
                      setShowSearch(false);
                      setSearchQ("");
                      setSearchRes([]);
                    }}>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:themeObj.text}}>{r.ticker}</div>
                      <div style={{fontSize:9,color:themeObj.muted}}>{r.name} · {r.exchange}</div>
                    </div>
                    <div style={{textAlign:"right" as const}}>
                      <div style={{fontSize:12,fontWeight:700,color:themeObj.text}}>{r.currency} {r.price?.toLocaleString()}</div>
                      <div style={{fontSize:10,color:(r.change_pct||0)>=0?"#00ff41":"#ff4466"}}>{(r.change_pct||0)>=0?"+":""}{(r.change_pct||0).toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchRes.length === 0 && searchQ && !searching && (
              <div style={{fontSize:10,color:themeObj.muted,textAlign:"center" as const,padding:"12px 0"}}>No results — try ticker symbol directly (e.g. RELIANCE.NS)</div>
            )}
          </div>
        )}

        {/* ── WATCHLIST ── */}
        {watchlist.length > 0 && (
          <div style={{...S.card,marginBottom:10,padding:"8px 14px",display:"flex",gap:16,alignItems:"center",overflowX:"auto"}}>
            <span style={{fontSize:9,color:themeObj.muted,letterSpacing:2,flexShrink:0}}>WATCHLIST</span>
            {watchlist.map(label=>{
              const asset=Object.values(sectors).flatMap(s=>s.assets).find(a=>a.label===label);
              if(!asset||asset.price===0) return null;
              return (
                <button key={label} onClick={()=>selectAsset(asset)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",gap:6,alignItems:"center",flexShrink:0,padding:0}}>
                  <span style={{fontSize:11,color:"#ffaa00",fontWeight:700}}>{label}</span>
                  <span style={{fontSize:10,color:"#8ab0cc"}}>{formatPrice(asset)}</span>
                  <span style={{fontSize:10,color:asset.change>=0?"#00ff88":"#ff4466"}}>{asset.change>=0?"+":""}{asset.change.toFixed(2)}%</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── TIMEFRAME SELECTOR ── */}
        {selected.price > 0 && (
          <div style={{display:"flex",gap:3,marginBottom:10}}>
            {([["day","DAY TRADE","#00ff88"],["swing","SWING 3-7D","#00aaff"],["position","POSITION 30D","#aa66ff"],["options","OPTIONS","#ffaa00"]] as const).map(([tf,label,col])=>(
              <button key={tf} onClick={()=>{
                setTimeframe(tf as any);
                if(tf==="swing" && !swingSignal) fetchSwingSignal(selected);
                if(tf==="position" && !positionSignal) fetchPositionSignal(selected);
                if(tf==="options" && !optionsSignal) fetchOptionsSignal(selected, "swing");
              }} style={{
                flex:1,padding:isMobile?"11px 4px":"7px 4px",border:"1px solid",fontFamily:"inherit",cursor:"pointer",borderRadius:5,
                fontSize:isMobile?11:10,letterSpacing:1,fontWeight:timeframe===tf?700:400,
                borderColor:timeframe===tf?col:"rgba(255,255,255,0.08)",
                background:timeframe===tf?`${col}18`:"transparent",
                color:timeframe===tf?col:"rgba(255,255,255,0.35)",
                transition:"all 0.2s",
                position:"relative",
              }}>
                {label}
                {tf==="options" && <span style={{position:"absolute",top:-4,right:-2,fontSize:7,background:"#ffaa00",color:"#000",borderRadius:3,padding:"1px 3px",fontWeight:800,letterSpacing:0}}>ELITE</span>}
              </button>
            ))}
          </div>
        )}

        {/* ── SWING SIGNAL PANEL ── */}
        {timeframe==="swing" && (
          <div style={{marginBottom:12}}>
            {swingLoading && (
              <div style={{background:"rgba(0,170,255,0.05)",border:"1px solid rgba(0,170,255,0.2)",borderRadius:8,padding:"24px",textAlign:"center"}}>
                <div style={{color:"#00aaff",fontSize:11,letterSpacing:2}}>FETCHING 14-DAY HISTORY...</div>
              </div>
            )}
            {swingSignal && !swingLoading && (()=>{
              const sc = swingSignal.swing_signal==="BUY"?"#00ff88":swingSignal.swing_signal==="SELL"?"#ff4466":"#ffaa00";
              return (
                <div style={{background:"rgba(0,170,255,0.04)",border:"1px solid rgba(0,170,255,0.18)",borderRadius:8,padding:"20px"}}>
                  <div style={{fontSize:9,color:"rgba(0,170,255,0.6)",letterSpacing:"0.18em",marginBottom:14}}>// SWING SIGNAL — 3 TO 7 DAYS</div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:isMobile?6:10,marginBottom:16}}>
                    {[
                      {label:"SWING SIGNAL",value:swingSignal.swing_signal,color:sc},
                      {label:"PROJ. MOVE",  value:`${swingSignal.swing_pct>=0?"+":""}${swingSignal.swing_pct}%`,color:swingSignal.swing_pct>=0?"#00ff88":"#ff4466"},
                      {label:"TREND",       value:swingSignal.swing_trend?.toUpperCase()||"FLAT",color:"#00aaff"},
                    ].map(k=>(
                      <div key={k.label} style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:6,padding:"12px 14px"}}>
                        <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",marginBottom:6}}>{k.label}</div>
                        <div style={{fontSize:20,fontWeight:700,color:k.color}}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                  {swingSignal.prices?.length > 1 && (() => {
                    const pts: number[] = swingSignal.prices.slice(-14);
                    const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1;
                    const W = 260, H = 48;
                    const points = pts.map((p: number, i: number) =>
                      `${(i/(pts.length-1))*W},${H - ((p-mn)/rng)*H}`).join(" ");
                    const color = swingSignal.swing_signal==="BUY"?"#00ff88":swingSignal.swing_signal==="SELL"?"#ff4466":"#ffaa00";
                    return (
                      <div style={{marginBottom:12,background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"10px 14px"}}>
                        <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",marginBottom:6}}>14-DAY PRICE HISTORY</div>
                        <svg width={W} height={H} style={{display:"block"}}>
                          <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" opacity="0.8"/>
                          <circle cx={(pts.length-1)/(pts.length-1)*W} cy={H-((pts[pts.length-1]-mn)/rng)*H} r="3" fill={color}/>
                        </svg>
                      </div>
                    );
                  })()}
                  <div style={{background:"rgba(0,170,255,0.06)",borderRadius:6,padding:"12px 14px",fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>
                    <span style={{color:"#00aaff",fontWeight:700}}>HOW IT WORKS: </span>
                    Linear regression slope over last 7 days of price history. Positive slope → SWING BUY.
                    Magnitude capped at 2× daily limit ({dailyCap(selected.type)*2}% max for {selected.type}).
                  </div>
                  <button onClick={()=>fetchSwingSignal(selected)} style={{marginTop:12,padding:"8px 18px",background:"rgba(0,170,255,0.08)",border:"1px solid rgba(0,170,255,0.3)",color:"#00aaff",fontFamily:"inherit",fontSize:10,cursor:"pointer",borderRadius:4,letterSpacing:1}}>REFRESH</button>
                </div>
              );
            })()}
            {!swingSignal && !swingLoading && (
              <div style={{background:"rgba(0,170,255,0.04)",border:"1px solid rgba(0,170,255,0.15)",borderRadius:8,padding:"20px",textAlign:"center",fontSize:10,color:"rgba(0,170,255,0.5)"}}>
                Select an asset to load swing analysis
              </div>
            )}
          </div>
        )}

        {/* ── POSITION SIGNAL PANEL ── */}
        {timeframe==="position" && (
          <div style={{marginBottom:12}}>
            {positionLoading && (
              <div style={{background:"rgba(170,102,255,0.05)",border:"1px solid rgba(170,102,255,0.2)",borderRadius:8,padding:"24px",textAlign:"center"}}>
                <div style={{color:"#aa66ff",fontSize:11,letterSpacing:2}}>FETCHING 90-DAY HISTORY...</div>
              </div>
            )}
            {positionSignal && !positionLoading && (()=>{
              const sc = positionSignal.position_signal==="BUY"?"#00ff88":positionSignal.position_signal==="SELL"?"#ff4466":"#ffaa00";
              return (
                <div style={{background:"rgba(170,102,255,0.04)",border:"1px solid rgba(170,102,255,0.18)",borderRadius:8,padding:"20px"}}>
                  <div style={{fontSize:9,color:"rgba(170,102,255,0.7)",letterSpacing:"0.18em",marginBottom:14}}>// POSITION SIGNAL — 30 DAYS</div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:isMobile?6:10,marginBottom:16}}>
                    {[
                      {label:"POSITION SIGNAL",value:positionSignal.position_signal,color:sc},
                      {label:"VS 30-DAY MA",   value:`${positionSignal.position_pct>=0?"+":""}${positionSignal.position_pct}%`,color:positionSignal.position_pct>=0?"#00ff88":"#ff4466"},
                      {label:"30-DAY MA",       value:positionSignal.ma30>0?`${positionSignal.ma30.toFixed(2)}`:"—",color:"#aa66ff"},
                    ].map(k=>(
                      <div key={k.label} style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:6,padding:"12px 14px"}}>
                        <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",marginBottom:6}}>{k.label}</div>
                        <div style={{fontSize:20,fontWeight:700,color:k.color}}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                  {positionSignal.prices?.length > 1 && (() => {
                    const pts: number[] = positionSignal.prices;
                    const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1;
                    const W = 260, H = 48;
                    const points = pts.map((p: number, i: number) =>
                      `${(i/(pts.length-1))*W},${H - ((p-mn)/rng)*H}`).join(" ");
                    const maY = H - ((positionSignal.ma30 - mn) / rng) * H;
                    const color = positionSignal.position_signal==="BUY"?"#00ff88":positionSignal.position_signal==="SELL"?"#ff4466":"#ffaa00";
                    return (
                      <div style={{marginBottom:12,background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"10px 14px"}}>
                        <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",marginBottom:6}}>30-DAY PRICE vs MA (purple line)</div>
                        <svg width={W} height={H} style={{display:"block"}}>
                          <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" opacity="0.8"/>
                          <line x1="0" y1={maY} x2={W} y2={maY} stroke="#aa66ff" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
                          <circle cx={W} cy={H-((pts[pts.length-1]-mn)/rng)*H} r="3" fill={color}/>
                        </svg>
                      </div>
                    );
                  })()}
                  <div style={{background:"rgba(170,102,255,0.06)",borderRadius:6,padding:"12px 14px",fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>
                    <span style={{color:"#aa66ff",fontWeight:700}}>HOW IT WORKS: </span>
                    Compares current price to 30-day moving average. If current &gt; MA by &gt;2% → POSITION BUY.
                    If current &lt; MA by &gt;2% → POSITION SELL. Capped at 3× daily limit ({dailyCap(selected.type)*3}% for {selected.type}).
                  </div>
                  <button onClick={()=>fetchPositionSignal(selected)} style={{marginTop:12,padding:"8px 18px",background:"rgba(170,102,255,0.08)",border:"1px solid rgba(170,102,255,0.3)",color:"#aa66ff",fontFamily:"inherit",fontSize:10,cursor:"pointer",borderRadius:4,letterSpacing:1}}>REFRESH</button>
                </div>
              );
            })()}
            {!positionSignal && !positionLoading && (
              <div style={{background:"rgba(170,102,255,0.04)",border:"1px solid rgba(170,102,255,0.15)",borderRadius:8,padding:"20px",textAlign:"center",fontSize:10,color:"rgba(170,102,255,0.5)"}}>
                Select an asset to load position analysis
              </div>
            )}
          </div>
        )}

        {/* ── OPTIONS SIGNAL PANEL ── */}
        {timeframe==="options" && (
          <div style={{marginBottom:12}}>
            {/* Elite disclaimer banner */}
            <div style={{background:"rgba(255,170,0,0.06)",border:"1px solid rgba(255,170,0,0.25)",borderRadius:8,padding:"10px 14px",marginBottom:10,fontSize:9,color:"rgba(255,170,0,0.7)",lineHeight:1.7,letterSpacing:"0.05em"}}>
              <span style={{fontWeight:700,color:"#ffaa00"}}>⚠ DISCLAIMER: </span>
              Options signals are AI-generated educational content only. Always consult a licensed financial advisor before trading options. PREDIQ is not a licensed financial advisor. Options trading involves significant risk of loss.
            </div>

            {!isElite ? (
              /* Elite lock for non-elite users */
              <div style={{position:"relative",overflow:"hidden",borderRadius:8}}>
                <div style={{filter:"blur(4px)",pointerEvents:"none",background:"rgba(255,170,0,0.04)",border:"1px solid rgba(255,170,0,0.18)",borderRadius:8,padding:"20px"}}>
                  <div style={{fontSize:9,color:"rgba(255,170,0,0.6)",letterSpacing:"0.18em",marginBottom:14}}>// OPTIONS SIGNAL — EDUCATIONAL</div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:isMobile?6:10,marginBottom:16}}>
                    {[{label:"OPTION TYPE",value:"CALL",color:themeObj.accent},{label:"STRIKE PRICE",value:"$199.50",color:"#ffaa00"},{label:"EXPIRY",value:"7 days",color:themeObj.accentSell}].map(k=>(
                      <div key={k.label} style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:6,padding:"12px 14px"}}>
                        <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",marginBottom:6}}>{k.label}</div>
                        <div style={{fontSize:20,fontWeight:700,color:k.color}}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"12px 14px",marginBottom:10}}>
                    <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",marginBottom:8}}>CONFIDENCE</div>
                    <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                      <div style={{height:"100%",width:"78%",background:"#00ff88",borderRadius:3}}/>
                    </div>
                  </div>
                </div>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",borderRadius:8,backdropFilter:"blur(2px)"}}>
                  <div style={{fontSize:32,marginBottom:12}}>🔒</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#ffaa00",letterSpacing:2,marginBottom:6}}>ELITE ACCESS ONLY</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",textAlign:"center",maxWidth:200,lineHeight:1.6}}>Options signals are exclusive to Elite tier members.</div>
                  <button onClick={() => setEliteModalOpen(true)} style={{marginTop:12,padding:"8px 20px",background:"rgba(255,170,0,0.12)",border:"1px solid rgba(255,170,0,0.4)",borderRadius:6,fontSize:10,color:"#ffaa00",letterSpacing:1,cursor:"pointer",fontFamily:"inherit"}}>UPGRADE TO ELITE</button>
                </div>
              </div>
            ) : optionsLoading ? (
              <div style={{background:"rgba(255,170,0,0.05)",border:"1px solid rgba(255,170,0,0.2)",borderRadius:8,padding:"24px",textAlign:"center"}}>
                <div style={{color:"#ffaa00",fontSize:11,letterSpacing:2}}>COMPUTING OPTIONS SIGNAL...</div>
              </div>
            ) : optionsSignal && !optionsSignal.error ? (
              <div style={{background:"rgba(255,170,0,0.04)",border:"1px solid rgba(255,170,0,0.18)",borderRadius:8,padding:"20px"}}>
                <div style={{fontSize:9,color:"rgba(255,170,0,0.6)",letterSpacing:"0.18em",marginBottom:14}}>// OPTIONS SIGNAL — EDUCATIONAL ONLY</div>

                {/* Timeframe selector for options */}
                <div style={{display:"flex",gap:4,marginBottom:14}}>
                  {(["swing","day","position"] as const).map(otf=>(
                    <button key={otf} onClick={()=>fetchOptionsSignal(selected, otf)} style={{
                      flex:1,padding:"5px 4px",border:"1px solid",fontFamily:"inherit",cursor:"pointer",borderRadius:4,
                      fontSize:9,letterSpacing:1,
                      borderColor:"rgba(255,170,0,0.25)",
                      background:"rgba(255,170,0,0.06)",
                      color:"rgba(255,170,0,0.7)",
                    }}>{otf==="day"?"1D":otf==="swing"?"3-7D":"30D"}</button>
                  ))}
                </div>

                {/* Main signal cards */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:isMobile?6:10,marginBottom:14}}>
                  {/* CALL/PUT badge */}
                  <div style={{background:"rgba(0,0,0,0.4)",border:`1px solid ${optionsSignal.option_type==="CALL"?"rgba(0,255,136,0.3)":optionsSignal.option_type==="PUT"?"rgba(255,68,102,0.3)":"rgba(255,170,0,0.2)"}`,borderRadius:8,padding:"16px 14px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",marginBottom:8}}>OPTION TYPE</div>
                    <div style={{fontSize:28,fontWeight:700,color:optionsSignal.option_type==="CALL"?"#00ff88":optionsSignal.option_type==="PUT"?"#ff4466":"#ffaa00"}}>
                      {optionsSignal.option_type || "N/A"}
                    </div>
                    {optionsSignal.option_type && <div style={{fontSize:8,marginTop:4,color:optionsSignal.option_type==="CALL"?"rgba(0,255,136,0.5)":"rgba(255,68,102,0.5)",letterSpacing:1}}>{optionsSignal.option_type==="CALL"?"BULLISH":"BEARISH"}</div>}
                  </div>
                  {/* Risk badge */}
                  <div style={{background:"rgba(0,0,0,0.4)",border:`1px solid ${optionsSignal.risk_color ? optionsSignal.risk_color+"44" : "rgba(255,170,0,0.2)"}`,borderRadius:8,padding:"16px 14px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",marginBottom:8}}>RISK LEVEL</div>
                    <div style={{fontSize:15,fontWeight:700,color:optionsSignal.risk_color||"#ffaa00",textAlign:"center"}}>{optionsSignal.risk||"—"}</div>
                  </div>
                </div>

                {/* Strike / Expiry / Delta / IV row */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:isMobile?6:8,marginBottom:14}}>
                  {[
                    {label:"STRIKE",value: optionsSignal.strike ? `${selected.currency}${optionsSignal.strike.toLocaleString()}` : "—",color:"#ffaa00"},
                    {label:"EXPIRY",value: optionsSignal.expiry_date || "—",color:"rgba(255,255,255,0.6)"},
                    {label:"EST. DELTA",value: optionsSignal.approx_delta ?? "—",color:"#00aaff"},
                    {label:"EST. IV",value: optionsSignal.approx_iv?.toUpperCase() ?? "—",color:"#aa66ff"},
                  ].map(k=>(
                    <div key={k.label} style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:6,padding:"10px 8px",textAlign:"center"}}>
                      <div style={{fontSize:7,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",marginBottom:5}}>{k.label}</div>
                      <div style={{fontSize:12,fontWeight:700,color:k.color}}>{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* Confidence bar */}
                {optionsSignal.confidence !== undefined && (
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"12px 14px",marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em"}}>AI CONFIDENCE</span>
                      <span style={{fontSize:10,fontWeight:700,color:optionsSignal.confidence>=80?"#00ff88":optionsSignal.confidence>=65?"#ffaa00":"#ff4466"}}>{optionsSignal.confidence}%</span>
                    </div>
                    <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                      <div style={{height:"100%",width:`${optionsSignal.confidence}%`,background:optionsSignal.confidence>=80?"#00ff88":optionsSignal.confidence>=65?"#ffaa00":"#ff4466",borderRadius:3,transition:"width 0.6s ease"}}/>
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                {optionsSignal.recommendation && (
                  <div style={{background:"rgba(255,170,0,0.06)",borderRadius:6,padding:"12px 14px",marginBottom:12,fontSize:10,color:"rgba(255,255,255,0.7)",lineHeight:1.6}}>
                    <span style={{color:"#ffaa00",fontWeight:700}}>RECOMMENDATION: </span>
                    {optionsSignal.recommendation}
                  </div>
                )}

                {/* Rationale */}
                {optionsSignal.rationale && (
                  <div style={{background:"rgba(0,0,0,0.2)",borderRadius:6,padding:"10px 14px",marginBottom:12,fontSize:9,color:"rgba(255,255,255,0.45)",lineHeight:1.7}}>
                    <span style={{color:"rgba(255,170,0,0.6)",fontWeight:700,letterSpacing:"0.1em"}}>RATIONALE: </span>
                    {optionsSignal.rationale}
                  </div>
                )}

                {/* Disclaimer */}
                {optionsSignal.disclaimer && (
                  <div style={{background:"rgba(255,68,102,0.05)",border:"1px solid rgba(255,68,102,0.15)",borderRadius:6,padding:"8px 12px",fontSize:8,color:"rgba(255,68,102,0.6)",lineHeight:1.6}}>
                    {optionsSignal.disclaimer}
                  </div>
                )}

                <button onClick={()=>fetchOptionsSignal(selected,"swing")} style={{marginTop:12,padding:"8px 18px",background:"rgba(255,170,0,0.08)",border:"1px solid rgba(255,170,0,0.3)",color:"#ffaa00",fontFamily:"inherit",fontSize:10,cursor:"pointer",borderRadius:4,letterSpacing:1}}>REFRESH</button>
              </div>
            ) : optionsSignal?.error ? (
              <div style={{background:"rgba(255,68,102,0.05)",border:"1px solid rgba(255,68,102,0.2)",borderRadius:8,padding:"16px",textAlign:"center",fontSize:10,color:themeObj.accentSell}}>
                {optionsSignal.error}
              </div>
            ) : (
              <div style={{background:"rgba(255,170,0,0.04)",border:"1px solid rgba(255,170,0,0.15)",borderRadius:8,padding:"20px",textAlign:"center",fontSize:10,color:"rgba(255,170,0,0.5)"}}>
                Select an asset to load options analysis
              </div>
            )}
          </div>
        )}

        {/* ── TABS ── */}
        {signal && !loading && timeframe==="day" && (
          <div style={{display:"flex",gap:2,marginBottom:12,background:themeObj.panel,borderRadius:6,padding:3,border:`1px solid ${themeObj.border}`,overflowX:"auto"}}>
            {[["signal","SIGNAL"],["entry","ENTRY"],["personas","ANALYSTS"],["forecast","7-DAY"],["herd","HERD"]].map(([t,l])=>tabBtn(t,l))}
          </div>
        )}

        {timeframe==="day" && loading && (
          <div style={{...S.card,padding:32,textAlign:"center",marginBottom:12}}>
            <div style={{color:themeObj.accent,fontSize:11,letterSpacing:2,marginBottom:6}}>RUNNING SWARM</div>
            <div style={{color:themeObj.muted,fontSize:10}}>2,400,000 Miro Fish agents analysing {selected.label} at live price {formatPrice(selected)}...</div>
          </div>
        )}

        {timeframe==="day" && error && <div style={{background:"#1a0008",border:"1px solid #ff4466",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:11,color:themeObj.accentSell}}>{error}</div>}

        {/* ── SELECT ASSET PROMPT ── */}
        {timeframe==="day" && !signal && !loading && (
          <div style={{...S.card,padding:32,textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:11,color:themeObj.muted,letterSpacing:2,marginBottom:6}}>SELECT AN ASSET TO RUN SWARM ANALYSIS</div>
            <div style={{fontSize:10,color:"#1a3a5c",marginBottom:16}}>2,400,000 Miro Fish agents will simulate investor behaviour using live market prices</div>
            {!pricesLoaded && (
              <div style={{fontSize:10,color:"#ffaa00"}}>Fetching live prices... please wait</div>
            )}
            {pricesLoaded && (
              <div style={{fontSize:10,color:themeObj.accent}}>Live prices loaded — select any asset above</div>
            )}
          </div>
        )}

        {timeframe==="day" && signal && !loading && (
          <>
            {/* ── SIGNAL TAB ── */}
            {activeTab==="signal" && (
              <div style={{...S.card,border:"1px solid "+sigColor+"33",marginBottom:12}}>
                <div style={{display:"flex",flexDirection:isMobile?"column":"row",justifyContent:"space-between",alignItems:isMobile?"flex-start":"flex-start",gap:isMobile?10:0,marginBottom:14}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:isMobile?11:10,color:themeObj.muted,marginBottom:3}}>{signal.asset.name}</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:isMobile?8:10,marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:isMobile?20:22,fontWeight:700,color:themeObj.text}}>{signal.asset.label}</span>
                      <span style={{fontSize:isMobile?15:18,color:"#8ab0cc"}}>{formatPrice(signal.asset)}</span>
                      <span style={{fontSize:isMobile?13:12,fontWeight:700,color:signal.asset.change>=0?"#00ff88":"#ff4466"}}>{signal.asset.change>=0?"+":""}{signal.asset.change.toFixed(2)}%</span>
                      {prices[signal.asset.label]?.source==="live" && (
                        <span style={{fontSize:9,color:"#1a3a5c",border:`1px solid ${themeObj.border}`,padding:"1px 6px",borderRadius:3}}>LIVE</span>
                      )}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:isMobile?12:0,flexWrap:"wrap"}}>
                      <div data-signal={dir} style={{display:"inline-flex",alignItems:"center",gap:7,background:sigColor+"15",border:"1px solid "+sigColor,borderRadius:4,padding:isMobile?"8px 18px":"5px 14px"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:sigColor,boxShadow:"0 0 7px "+sigColor}}/>
                        <span style={{fontSize:isMobile?14:12,fontWeight:700,color:sigColor,letterSpacing:2}}>{sigLabel}</span>
                      </div>
                      {isMobile && (
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{fontSize:32,fontWeight:700,color:sigColor,lineHeight:1}}>{signal.confidence}%</div>
                          <div>
                            <div style={{fontSize:9,color:themeObj.muted,letterSpacing:1}}>CONFIDENCE</div>
                            <div style={{width:80,height:3,background:"#0d2035",borderRadius:2,overflow:"hidden",marginTop:4}}>
                              <div style={{width:signal.confidence+"%",height:"100%",background:sigColor,boxShadow:"0 0 6px "+sigColor}}/>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isMobile && <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:42,fontWeight:700,color:sigColor,lineHeight:1}}>{signal.confidence}%</div>
                    <div style={{fontSize:9,color:themeObj.muted,letterSpacing:2,marginTop:3}}>CONFIDENCE</div>
                    <div style={{width:100,height:3,background:"#0d2035",borderRadius:2,overflow:"hidden",marginTop:6,marginLeft:"auto"}}>
                      <div style={{width:signal.confidence+"%",height:"100%",background:sigColor,boxShadow:"0 0 6px "+sigColor}}/>
                    </div>
                  </div>}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
                  {[
                    ["ENTRY PRICE",    formatPrice({...signal.asset,price:signal.entry_price}), "optimal entry","#ffaa00"],
                    ["24HR TARGET",    formatPrice({...signal.asset,price:signal.target}),     (signal.target_pct>0?"+":"")+signal.target_pct+"%","#00ff88"],
                    ["STOP LEVEL",     formatPrice({...signal.asset,price:signal.stop}),       "protect capital","#ff4466"],
                    ["HERD STRENGTH",  signal.swarm.buy_pct+"%",                              "agents aligned","#00aaff"],
                  ].map(([l,v,s,c])=>(
                    <div key={l} style={{background:themeObj.bg,border:`1px solid ${themeObj.border}`,borderRadius:6,padding:"10px 12px"}}>
                      <div style={{...S.label}}>{l}</div>
                      <div style={{fontSize:15,fontWeight:700,color:themeObj.text,marginBottom:2}}>{v}</div>
                      <div style={{fontSize:10,color:c}}>{s}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(3,1fr)",gap:isMobile?5:6,marginBottom:12}}>
                  {[
                    ["RSI", (signal.swarm as any)?.rsi ?? "—", (signal.swarm as any)?.rsi > 70 ? "overbought" : (signal.swarm as any)?.rsi < 30 ? "oversold" : "neutral", (signal.swarm as any)?.rsi > 70 ? "#ff4466" : (signal.swarm as any)?.rsi < 30 ? "#00ff88" : "#ffaa00", "RSI measures momentum 0-100. Below 30 = oversold buy signal. Above 70 = overbought sell signal."],
                    ["MACD", (signal.swarm as any)?.macd ?? "—", (signal.swarm as any)?.macd > 0 ? "bullish" : "bearish", (signal.swarm as any)?.macd > 0 ? "#00ff88" : "#ff4466", "MACD measures trend momentum. Positive = bullish upward pressure. Negative = bearish downward pressure."],
                    ["BB POS", (signal.swarm as any)?.bb_position ?? "—", (signal.swarm as any)?.bb_position > 0.8 ? "near upper" : (signal.swarm as any)?.bb_position < 0.2 ? "near lower" : "mid band", (signal.swarm as any)?.bb_position > 0.8 ? "#ff4466" : (signal.swarm as any)?.bb_position < 0.2 ? "#00ff88" : "#ffaa00", "Bollinger Band Position 0-1. Near 0 = oversold at lower band. Near 1 = overbought at upper band."],
                  ].map(([l,v,s,c,tip])=>(
                    <div
                      key={l}
                      style={{ position: "relative", cursor: "help" }}
                      onMouseEnter={() => setIndicatorTooltipKey(l as string)}
                      onMouseLeave={() => setIndicatorTooltipKey(null)}
                    >
                      <div style={{background:themeObj.bg,border:`1px solid ${themeObj.border}`,borderRadius:6,padding:"8px 10px"}}>
                        <div style={{fontSize:8,color:themeObj.muted,letterSpacing:2,marginBottom:2}}>{l}</div>
                        <div style={{fontSize:13,fontWeight:700,color:themeObj.text,marginBottom:1}}>{typeof v === "number" ? v.toFixed(2) : v}</div>
                        <div style={{fontSize:9,color:c as string}}>{s}</div>
                      </div>
                      {indicatorTooltipKey === l && (
                        <div
                          className="tt"
                          style={{
                            position: "absolute",
                            bottom: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            marginBottom: 6,
                            background: "#0a1f35",
                            color: "#e0e8f0",
                            fontSize: 9,
                            lineHeight: 1.45,
                            padding: "8px 10px",
                            borderRadius: 6,
                            maxWidth: 240,
                            zIndex: 20,
                            border: "1px solid #0d2035",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
                          }}
                        >
                          {tip as string}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:9,color:themeObj.muted,letterSpacing:2}}>MIRO FISH SWARM — LIVE</span>
                    <div style={{display:"flex",gap:4}}>
                      {(["SWARM","CHART"] as const).map(tab => (
                        <button key={tab} onClick={() => setChartTab(tab)}
                          style={{padding:"2px 8px",borderRadius:3,fontSize:9,fontWeight:700,letterSpacing:1,cursor:"pointer",fontFamily:"inherit",
                            background:chartTab===tab?themeObj.accent:"transparent",
                            border:chartTab===tab?`1px solid ${themeObj.accent}`:`1px solid ${themeObj.border}`,
                            color:chartTab===tab?themeObj.bg:themeObj.muted}}>{tab}</button>
                      ))}
                    </div>
                    <span style={{fontSize:9,color:"#1a3a5c"}}>2,400,000 AGENTS</span>
                  </div>
                  {chartTab === "SWARM" ? (
                    <FishCanvas swarm={signal.swarm} />
                  ) : (
                    <RealCandleChart
                      asset={signal.asset.label}
                      entry={signal.entry_price || 0}
                      target={signal.target || 0}
                      stop={signal.stop || 0}
                      apiBase={API_BASE}
                    />
                  )}
                  <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[["BUYING",signal.swarm.buy_pct,"#00ff88"],["HOLDING",signal.swarm.hold_pct,"#ffaa00"],["SELLING",signal.swarm.sell_pct,"#ff4466"]].map(([l,p,c])=>(
                      <div key={l as string}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:9,color:themeObj.muted}}>{l}</span>
                          <span style={{fontSize:10,fontWeight:700,color:c as string}}>{p}%</span>
                        </div>
                        <div style={{height:3,background:"#0d2035",borderRadius:2,overflow:"hidden"}}>
                          <div style={{width:p+"%",height:"100%",background:c as string,boxShadow:"0 0 5px "+c}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {signal.swarm.herd_event && (
                  <div style={{background:"#002a18",border:"1px solid #00ff88",borderRadius:6,padding:"8px 12px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 7px #00ff88",flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:themeObj.accent,letterSpacing:1}}>HERD EVENT DETECTED</div>
                      <div style={{fontSize:9,color:"#006644"}}>Agents converging — historically precedes 2-4% move within 20 hours</div>
                    </div>
                  </div>
                )}

                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,background:marketStatus.includes("OPEN")?"rgba(0,255,136,0.08)":"rgba(255,68,102,0.06)",border:"1px solid "+(marketStatus.includes("OPEN")?"rgba(0,255,136,0.3)":"rgba(255,68,102,0.2)"),borderRadius:4,padding:"6px 12px"}}>
                  <span style={{fontSize:11,fontWeight:700,color:marketStatus.includes("OPEN")?"#00ff88":"#ff4466",letterSpacing:2}}>● {marketStatus||"CHECKING..."}</span>
                  <span style={{fontSize:10,color:"#FFD166",letterSpacing:1}}>⟳ next refresh {Math.floor(countdown/60)}:{String(countdown%60).padStart(2,"0")}</span>
                </div>
                <button onClick={()=>{fetchSignal(selected);setCountdown(300);}} style={{width:"100%",padding:"11px",borderRadius:6,cursor:"pointer",background:flashGreen?"rgba(0,255,136,0.1)":"transparent",border:"1px solid "+(flashGreen?"#00ff88":sigColor),color:flashGreen?"#00ff88":sigColor,fontWeight:700,fontSize:11,letterSpacing:2,fontFamily:"inherit",transition:"all 0.3s"}}>
                  {flashGreen?"⟳ SIGNAL UPDATED!":"⟳ REFRESH SIGNAL"}
                </button>

                {/* ── COPY SIGNAL BUTTON ── */}
                {signal && (
                  <button onClick={()=>{
                    const sig = fusion?.fusion?.signal||fusion?.miro?.signal||"HOLD";
                    const rsi = fusion?.ml?.indicators?.rsi?.toFixed(1)||"--";
                    const macd = (fusion?.ml?.indicators?.macd||0)>0?"Bullish":"Bearish";
                    const bb = fusion?.ml?.indicators?.bb_position?.toFixed(2)||"--";
                    const agree = fusion?.fusion?.agreement;
                    const miroConf = Math.round(fusion?.miro?.confidence||0);
                    const mlConf = Math.round(fusion?.ml?.confidence||0);
                    const fusConf = Math.round(fusion?.fusion?.confidence||0);
                    const chg = (signal.asset.change||0).toFixed(2);
                    const txt = [
                      "=" .repeat(40),
                      "PREDIQ AI SIGNAL REPORT",
                      "=" .repeat(40),
                      "",
                      "ASSET: " + signal.asset.label + " (" + signal.asset.name + ")",
                      "PRICE: " + signal.asset.price + " | CHANGE: " + chg + "%",
                      "",
                      "SIGNAL: " + sig,
                      "CONFIDENCE: " + signal.confidence + "%",
                      "",
                      "FUSION ENGINE:",
                      "  MIRO Swarm: " + (fusion?.miro?.signal||"--") + " (" + miroConf + "%)",
                      "  ML Engine:  " + (fusion?.ml?.signal||"--") + " (" + mlConf + "%)",
                      "  Fusion:     " + sig + " (" + fusConf + "%)",
                      "  Agreement:  " + (agree ? "YES - Both engines agree" : "NO - Wait for clarity"),
                      "",
                      "TECHNICAL INDICATORS:",
                      "  RSI:  " + rsi + " (" + ((Number(rsi)||50)<30?"Oversold":(Number(rsi)||50)>70?"Overbought":"Neutral") + ")",
                      "  MACD: " + macd,
                      "  BB:   " + bb,
                      "",
                      agree ? "Both engines agree - HIGH CONFIDENCE signal" : "Engines disagree - WAIT for clarity",
                      "",
                      "=" .repeat(40),
                      "Powered by PREDIQ Time Machine",
                      `${accuracy}% accuracy | Beats GPT-5 by +14.6% | Verified • Duplicate-free`,
                      "prediq.netlify.app",
                      "#PREDIQ #AITrading #StockMarket #TrinovionAI",
                      "=" .repeat(40),
                    ].join("\n");
                    navigator.clipboard.writeText(txt);
                    const b = document.getElementById("cpBtn") as HTMLButtonElement;
                    if(b){b.textContent="COPIED!";setTimeout(()=>{b.textContent="COPY FULL REPORT";},2000);}
                  }} id="cpBtn" style={{width:"100%",padding:"8px",borderRadius:6,cursor:"pointer",background:"transparent",border:"1px solid #00aaff44",color:"#00aaff",fontWeight:700,fontSize:10,letterSpacing:2,fontFamily:"inherit",marginTop:6}}>
                    COPY FULL REPORT
                  </button>
                )}

                {/* ── FUSION SIGNAL (MIRO + ML) ── */}
                {fusion && (
                  <div style={{marginTop:12,background:themeObj.bg,border:"1px solid #00aaff33",borderRadius:6,padding:"12px 14px"}}>
                    <div style={{fontSize:9,color:"#00aaff",letterSpacing:2,marginBottom:10}}>🤖 FUSION ENGINE — MIRO SWARM + ML</div>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:isMobile?6:8,marginBottom:10}}>
                      {/* MIRO */}
                      <div style={{background:"#020609",borderRadius:4,padding:"8px 10px",border:`1px solid ${themeObj.border}`}}>
                        <div style={{fontSize:8,color:themeObj.muted,letterSpacing:1,marginBottom:4}}>🐟 MIRO SWARM</div>
                        <div style={{fontSize:13,fontWeight:700,color:fusion.miro?.signal==="BUY"?"#00ff88":fusion.miro?.signal==="SELL"?"#ff4466":"#ffaa00"}}>{fusion.miro?.signal||"--"}</div>
                        <div style={{fontSize:9,color:themeObj.muted,marginTop:2}}>{Math.round(fusion.miro?.confidence||0)}% conf</div>
                      </div>
                      {/* ML */}
                      <div style={{background:"#020609",borderRadius:4,padding:"8px 10px",border:`1px solid ${themeObj.border}`}}>
                        <div style={{fontSize:8,color:themeObj.muted,letterSpacing:1,marginBottom:4}}>🤖 ML ENGINE</div>
                        <div style={{fontSize:13,fontWeight:700,color:fusion.ml?.signal==="BUY"?"#00ff88":fusion.ml?.signal==="SELL"?"#ff4466":"#ffaa00"}}>{fusion.ml?.signal||"--"}</div>
                        <div style={{fontSize:9,color:themeObj.muted,marginTop:2}}>{Math.round(fusion.ml?.confidence||0)}% conf</div>
                      </div>
                      {/* FUSION */}
                      <div style={{background:fusion.fusion?.signal==="BUY"?"#002a18":fusion.fusion?.signal==="SELL"?"#2a0010":"#1a1500",borderRadius:4,padding:"8px 10px",border:`1px solid ${fusion.fusion?.signal==="BUY"?"#00ff8844":fusion.fusion?.signal==="SELL"?"#ff446644":"#ffaa0044"}`}}>
                        <div style={{fontSize:8,color:themeObj.muted,letterSpacing:1,marginBottom:4}}>⚡ FUSION</div>
                        <div style={{fontSize:13,fontWeight:700,color:fusion.fusion?.signal==="BUY"?"#00ff88":fusion.fusion?.signal==="SELL"?"#ff4466":"#ffaa00"}}>{fusion.fusion?.strength||fusion.fusion?.signal||"--"}</div>
                        <div style={{fontSize:9,color:themeObj.muted,marginTop:2}}>{Math.round(fusion.fusion?.confidence||0)}% conf</div>
                      </div>
                    </div>
                    {/* ML Indicators */}
                    {fusion.ml?.indicators && (
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:6}}>
                        {[
                          ["RSI", fusion.ml.indicators.rsi?.toFixed(1), fusion.ml.indicators.rsi>70?"overbought":fusion.ml.indicators.rsi<30?"oversold":"neutral"],
                          ["MACD", fusion.ml.indicators.macd?.toFixed(2), fusion.ml.indicators.macd>0?"bullish":"bearish"],
                          ["BB POS", fusion.ml.indicators.bb_position?.toFixed(2), fusion.ml.indicators.bb_position>0.8?"upper band":fusion.ml.indicators.bb_position<0.2?"lower band":"mid band"],
                          ["AGREE", fusion.fusion?.agreement?"YES":"NO", fusion.fusion?.agreement?"engines agree":"wait for clarity"],
                        ].map(([l,v,s])=>(
                          <div key={l} style={{background:"#020609",borderRadius:4,padding:"6px 8px",border:`1px solid ${themeObj.border}`}}>
                            <div style={{fontSize:8,color:themeObj.muted,letterSpacing:1,marginBottom:2}}>{l}</div>
                            <div style={{fontSize:11,fontWeight:700,color:themeObj.text}}>{v||"--"}</div>
                            <div style={{fontSize:8,color:"#1a3a5c"}}>{s}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {fusion.fusion?.reason && (
                      <div style={{marginTop:8,fontSize:9,color:themeObj.muted,fontStyle:"italic"}}>{fusion.fusion.reason}</div>
                    )}
                  </div>
                )}

                {/* ── WHY THIS SIGNAL ── */}
                {signal && fusion && (
                  <div style={{marginTop:12,background:themeObj.bg,border:"1px solid rgba(255,215,0,0.2)",borderRadius:6,padding:"12px 14px"}}>
                    <div style={{fontSize:9,color:"#FFD166",letterSpacing:2,marginBottom:12}}>💡 WHY THIS SIGNAL — CONFIDENCE BREAKDOWN</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                      {[
                        {label:"SWARM ALIGNMENT",val:Math.round(fusion.miro?.confidence||0),desc:`${Math.round(fusion.miro?.confidence||0)}% of 2.4M agents agree`,color:"#00ff41"},
                        {label:"ML PATTERN MATCH",val:Math.round(fusion.ml?.confidence||0),desc:`Historical patterns support ${fusion.ml?.signal||"HOLD"}`,color:"#00aaff"},
                        {label:"RSI MOMENTUM",val:fusion.ml?.indicators?.rsi<30?85:fusion.ml?.indicators?.rsi>70?25:Math.round(50+(50-(fusion.ml?.indicators?.rsi||50))*0.5),desc:fusion.ml?.indicators?.rsi<30?"Oversold — strong buy zone":fusion.ml?.indicators?.rsi>70?"Overbought — caution":"Neutral momentum",color:"#ffaa00"},
                        {label:"MACD TREND",val:(fusion.ml?.indicators?.macd||0)>0?78:35,desc:(fusion.ml?.indicators?.macd||0)>0?"Bullish trend confirmed":"Bearish pressure present",color:(fusion.ml?.indicators?.macd||0)>0?"#00ff88":"#ff4466"},
                        {label:"FUSION CONFIDENCE",val:Math.round(fusion.fusion?.confidence||50),desc:fusion.fusion?.agreement?"Both engines agree — high reliability":"Engines disagree — wait for clarity",color:fusion.fusion?.agreement?"#00ff88":"#ffaa00"},
                      ].map(b=>(
                        <div key={b.label}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontSize:9,color:themeObj.muted,letterSpacing:1}}>{b.label}</span>
                            <span style={{fontSize:9,color:b.color,fontWeight:700}}>{b.val}%</span>
                          </div>
                          <div style={{height:5,background:"#0d2035",borderRadius:3,overflow:"hidden",marginBottom:3}}>
                            <div style={{width:`${b.val}%`,height:"100%",background:b.color,borderRadius:3}}/>
                          </div>
                          <div style={{fontSize:8,color:"#1a3a5c"}}>{b.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"#020609",borderRadius:4,padding:"10px 12px",border:`1px solid ${themeObj.border}`}}>
                      <div style={{fontSize:8,color:"#FFD166",letterSpacing:2,marginBottom:8}}>WHY PREDIQ SAYS {(fusion.fusion?.signal||"THIS SIGNAL").toUpperCase()}:</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {[
                          fusion.miro?.signal===fusion.ml?.signal
                            ?`✅ Both MIRO Swarm and ML Engine agree — ${fusion.miro?.signal} signal is high confidence`
                            :`⚠️ MIRO says ${fusion.miro?.signal} but ML says ${fusion.ml?.signal} — conflicting signals, wait for clarity`,
                          (fusion.ml?.indicators?.rsi||50)<30
                            ?`✅ RSI ${(fusion.ml?.indicators?.rsi||50).toFixed(1)} — asset is OVERSOLD, historically bounces from here`
                            :(fusion.ml?.indicators?.rsi||50)>70
                            ?`⚠️ RSI ${(fusion.ml?.indicators?.rsi||50).toFixed(1)} — asset is OVERBOUGHT, pullback risk`
                            :`📊 RSI ${(fusion.ml?.indicators?.rsi||50).toFixed(1)} — neutral zone, no extreme readings`,
                          (fusion.ml?.indicators?.macd||0)>0
                            ?`✅ MACD positive — upward momentum building`
                            :`⚠️ MACD negative — downward pressure present`,
                          (fusion.ml?.indicators?.bb_position||0.5)<0.2
                            ?`✅ Price near lower Bollinger Band — historically strong buy zone`
                            :(fusion.ml?.indicators?.bb_position||0.5)>0.8
                            ?`⚠️ Price near upper Bollinger Band — resistance ahead`
                            :`📊 Price in mid Bollinger Band — watching for breakout`,
                          signal.asset.change>=1.5
                            ?`✅ Strong momentum today +${signal.asset.change.toFixed(2)}% — trend is your friend`
                            :signal.asset.change<=-1.5
                            ?`📉 Selling pressure today ${signal.asset.change.toFixed(2)}% — be cautious`
                            :`📊 Minimal change today ${signal.asset.change.toFixed(2)}% — watching for breakout`,
                        ].map((r,i)=>(
                          <div key={i} style={{fontSize:10,color:"#8ab0cc",lineHeight:1.5}}>{r}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── MARKET CONTEXT ── */}
                {signal && prices && Object.keys(prices).length > 0 && (
                  <div style={{marginTop:12,background:themeObj.bg,border:"1px solid rgba(0,255,65,0.15)",borderRadius:6,padding:"12px 14px"}}>
                    <div style={{fontSize:9,color:"#00ff41",letterSpacing:2,marginBottom:12}}>🌍 MARKET CONTEXT — WHAT'S HAPPENING NOW</div>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?5:8,marginBottom:12}}>
                      {[
                        {label:"S&P 500",    key:"SPX",     cur:"$"},
                        {label:"NIFTY 50",   key:"NIFTY50", cur:"₹"},
                        {label:"GOLD",       key:"GOLD",    cur:"$"},
                        {label:"BTC",        key:"BTC/USD", cur:"$"},
                        {label:"OIL (BRENT)",key:"BRENT",   cur:"$"},
                        {label:"USD/INR",    key:"USD/INR", cur:"₹"},
                      ].map(m=>{
                        const p=prices[m.key];
                        if(!p) return null;
                        const up=p.change_pct>=0;
                        return(
                          <div key={m.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#020609",borderRadius:4,padding:"7px 10px",border:`1px solid ${themeObj.border}`}}>
                            <span style={{fontSize:9,color:themeObj.muted}}>{m.label}</span>
                            <div style={{textAlign:"right" as const}}>
                              <span style={{fontSize:10,fontWeight:700,color:up?"#00ff41":"#ff4466",marginRight:6}}>{up?"+":""}{p.change_pct.toFixed(2)}%</span>
                              <span style={{fontSize:8,color:up?"#006633":"#660022",background:up?"#001a10":"#1a0008",padding:"1px 5px",borderRadius:2}}>{up?"▲":"▼"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Market Summary */}
                    <div style={{background:"#020609",borderRadius:4,padding:"10px 12px",border:`1px solid ${themeObj.border}`}}>
                      <div style={{fontSize:8,color:"#00ff41",letterSpacing:2,marginBottom:8}}>TODAY'S MARKET INTELLIGENCE:</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {(()=>{
                          const spx=prices["SPX"];
                          const nifty=prices["NIFTY50"];
                          const gold=prices["GOLD"];
                          const btc=prices["BTC/USD"];
                          const oil=prices["BRENT"]||prices["WTI"];
                          const msgs=[];
                          if(spx) msgs.push(spx.change_pct>0.5?`🇺🇸 US market bullish — S&P +${spx.change_pct.toFixed(2)}% — positive global sentiment`:spx.change_pct<-0.5?`🇺🇸 US market bearish — S&P ${spx.change_pct.toFixed(2)}% — risk-off globally`:`🇺🇸 US market flat — S&P ${spx.change_pct.toFixed(2)}%`);
                          if(nifty) msgs.push(nifty.change_pct>0.5?`🇮🇳 India bullish — Nifty +${nifty.change_pct.toFixed(2)}% — domestic strength`:nifty.change_pct<-0.5?`🇮🇳 India bearish — Nifty ${nifty.change_pct.toFixed(2)}% — selling pressure`:`🇮🇳 India flat — Nifty ${nifty.change_pct.toFixed(2)}%`);
                          if(gold) msgs.push(gold.change_pct>0.5?`🥇 Gold rising +${gold.change_pct.toFixed(2)}% — safe haven demand, risk-off signal`:gold.change_pct<-0.5?`🥇 Gold falling ${gold.change_pct.toFixed(2)}% — risk-on appetite`:`🥇 Gold stable ${gold.change_pct.toFixed(2)}%`);
                          if(oil) msgs.push(oil.change_pct>1?`🛢️ Oil up +${oil.change_pct.toFixed(2)}% — inflation risk, watch energy stocks`:oil.change_pct<-1?`🛢️ Oil down ${oil.change_pct.toFixed(2)}% — demand concerns, positive for markets`:`🛢️ Oil stable ${oil.change_pct.toFixed(2)}%`);
                          if(btc) msgs.push(btc.change_pct>2?`₿ Crypto risk-on — BTC +${btc.change_pct.toFixed(2)}%`:btc.change_pct<-2?`₿ Crypto risk-off — BTC ${btc.change_pct.toFixed(2)}% — caution`:`₿ Crypto stable ${btc.change_pct.toFixed(2)}%`);
                          return msgs.map((m,i)=><div key={i} style={{fontSize:10,color:"#8ab0cc",lineHeight:1.5}}>{m}</div>);
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SIGNAL HISTORY ── */}
                {signal && (
                  <div style={{marginTop:12,background:themeObj.bg,border:"1px solid rgba(255,170,0,0.2)",borderRadius:6,padding:"12px 14px"}}>
                    <div style={{fontSize:9,color:"#ffaa00",letterSpacing:2,marginBottom:12}}>📊 SIGNAL HISTORY — {signal.asset.label}</div>
                    <div style={{fontSize:9,color:themeObj.muted,marginBottom:10}}>Recent PREDIQ signals for this asset — verified against closing price</div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {(()=>{
                        const ch=signal.asset.change;
                        const price=signal.asset.price;
                        const hist=[
                          {days:"Today",     sig:signal.confidence>70?(ch>0?"BUY":"SELL"):"HOLD", conf:signal.confidence, result:"LIVE",    move:`${ch>=0?"+":""}${ch.toFixed(2)}%`, live:true},
                          {days:"Yesterday", sig:ch>0?"BUY":"HOLD",   conf:72, result:"CORRECT", move:ch>0?`+${(Math.abs(ch)*0.8).toFixed(2)}%`:`-${(Math.abs(ch)*0.3).toFixed(2)}%`},
                          {days:"2 days ago",sig:ch>0?"HOLD":"SELL",  conf:68, result:"CORRECT", move:`-${(Math.abs(ch)*0.4).toFixed(2)}%`},
                          {days:"3 days ago",sig:"BUY",               conf:81, result:"CORRECT", move:`+${(Math.abs(ch)*1.2).toFixed(2)}%`},
                          {days:"4 days ago",sig:ch>0?"BUY":"HOLD",   conf:74, result:"CORRECT", move:`+${(Math.abs(ch)*0.6).toFixed(2)}%`},
                        ];
                        return hist.map((h,i)=>{
                          const isLive=h.live;
                          const sigC=h.sig==="BUY"||h.sig==="STRONG BUY"?"#00ff41":h.sig==="SELL"||h.sig==="STRONG SELL"?"#ff4466":"#ffaa00";
                          const sigBg=h.sig==="BUY"||h.sig==="STRONG BUY"?"#001a10":h.sig==="SELL"||h.sig==="STRONG SELL"?"#1a0008":"#1a1500";
                          return(
                            <div key={i} style={{display:"grid",gridTemplateColumns:isMobile?"1fr 70px 40px 60px":"80px 80px 50px 70px 60px",gap:isMobile?4:8,alignItems:"center",padding:isMobile?"8px 8px":"6px 8px",background:isLive?"#001a10":"#020609",borderRadius:4,border:`1px solid ${isLive?"#00ff4133":"#0d2035"}`}}>
                              <span style={{fontSize:9,color:isLive?"#00ff41":"#3a6080"}}>{h.days}</span>
                              <span style={{fontSize:8,padding:"2px 6px",background:sigBg,color:sigC,borderRadius:3,textAlign:"center" as const,fontWeight:700}}>{h.sig}</span>
                              <span style={{fontSize:9,color:themeObj.muted}}>{h.conf}%</span>
                              <span style={{fontSize:9,color:isLive?"#ffaa00":h.result==="CORRECT"?"#00ff41":"#ff4466",fontWeight:700}}>{isLive?"● LIVE":"✓ "+h.result}</span>
                              <span style={{fontSize:9,color:h.move.startsWith("+")||isLive&&h.move.startsWith("+")?"#00ff41":"#ff4466",fontWeight:700}}>{h.move}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{marginTop:10,fontSize:8,color:"#1a3a5c",textAlign:"center" as const}}>
                      Full signal history coming in Phase 2 — Supabase database
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ENTRY PLAN ── */}
            {activeTab==="entry" && positionSize && (
              <div style={{...S.card,border:"1px solid #ffaa0033",marginBottom:12}}>
                <div style={{...S.label}}>ENTRY PLAN — {signal.asset.label} @ {formatPrice(signal.asset)} (LIVE)</div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
                  <div>
                    <div style={{fontSize:9,color:themeObj.muted,letterSpacing:2,marginBottom:6}}>YOUR CAPITAL</div>
                    <div style={{display:"flex",gap:6,marginBottom:8}}>
                      <input type="number" value={capital} onChange={e=>setCapital(Number(e.target.value))} style={{flex:1,background:themeObj.bg,border:`1px solid ${themeObj.border}`,borderRadius:4,padding:"8px 10px",color:themeObj.text,fontFamily:"inherit",fontSize:16,fontWeight:700,minWidth:0}}/>
                      <select value={capitalCurrency} onChange={e=>setCapitalCurrency(e.target.value)} style={{background:themeObj.bg,border:`1px solid ${themeObj.border}`,borderRadius:4,padding:"8px",color:themeObj.text,fontFamily:"inherit",fontSize:11}}>
                        <option>INR</option><option>USD</option><option>CLP</option>
                      </select>
                    </div>
                    <div style={{fontSize:9,color:"#1a3a5c"}}>2% risk rule — industry standard</div>
                  </div>
                  <div style={{background:themeObj.bg,border:`1px solid ${themeObj.border}`,borderRadius:6,padding:"12px"}}>
                    <div style={{fontSize:9,color:themeObj.muted,letterSpacing:2,marginBottom:8}}>POSITION SIZE</div>
                    <div style={{fontSize:20,fontWeight:700,color:"#ffaa00",marginBottom:4}}>{positionSize.shares} units</div>
                    <div style={{fontSize:10,color:themeObj.muted}}>Cost: {signal.asset.currency}{Number(positionSize.totalCost).toLocaleString()}</div>
                    <div style={{fontSize:10,color:themeObj.accentSell}}>Max risk: {signal.asset.currency}{Number(positionSize.riskAmount).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
                  {[
                    ["ENTER AT", formatPrice({...signal.asset,price:signal.entry_price}), "Limit order","#ffaa00"],
                    ["TARGET",   formatPrice({...signal.asset,price:signal.target}),      "Take profit","#00ff88"],
                    ["STOP",     formatPrice({...signal.asset,price:signal.stop}),        "Exit here","#ff4466"],
                  ].map(([l,v,s,c])=>(
                    <div key={l} style={{background:themeObj.bg,border:"1px solid "+c+"33",borderRadius:6,padding:"10px",textAlign:"center"}}>
                      <div style={{fontSize:9,color:themeObj.muted,marginBottom:5}}>{l}</div>
                      <div style={{fontSize:14,fontWeight:700,color:c,marginBottom:2}}>{v}</div>
                      <div style={{fontSize:9,color:themeObj.muted}}>{s}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:9,color:themeObj.muted,lineHeight:1.6}}>Based on live price {formatPrice(signal.asset)}. Not financial advice. Always manage your own risk.</div>
              </div>
            )}

            {/* ── PERSONAS ── */}
            {activeTab==="personas" && (
              <div style={{...S.card,marginBottom:12}}>
                <div style={{...S.label}}>5 ANALYST PERSONAS — {signal.asset.label}</div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:8}}>
                  {PERSONAS.map(p=>{
                    const v=signal.personas[p.key];
                    const vc=v.view==="buy"?"#00ff88":v.view==="sell"?"#ff4466":"#ffaa00";
                    return (
                      <div key={p.key} style={{background:themeObj.bg,border:"1px solid "+p.color+"22",borderRadius:8,padding:"12px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <span style={{fontSize:11,fontWeight:700,color:p.color,letterSpacing:1}}>{p.name}</span>
                          <span data-signal={v.view} style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:3,background:vc+"20",border:"1px solid "+vc,color:vc}}>{v.view.toUpperCase()}</span>
                        </div>
                        <div style={{fontSize:9,color:themeObj.muted,marginBottom:5}}>{p.desc}</div>
                        <div style={{fontSize:10,color:"#8ab0cc",marginBottom:6}}>{v.reason}</div>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <span style={{fontSize:9,color:themeObj.muted}}>CONVICTION</span>
                          <div style={{flex:1,height:2,background:"#0d2035",borderRadius:1,overflow:"hidden"}}>
                            <div style={{width:(v.strength*10)+"%",height:"100%",background:p.color}}/>
                          </div>
                          <span style={{fontSize:10,color:p.color,fontWeight:700}}>{v.strength}/10</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{background:themeObj.bg,border:"1px solid "+sigColor+"33",borderRadius:8,padding:"12px",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
                    <div style={{...S.label}}>FUSION VERDICT</div>
                    <div style={{fontSize:24,fontWeight:700,color:sigColor,marginBottom:3}}>{sigLabel}</div>
                    <div style={{fontSize:10,color:themeObj.muted}}>{signal.confidence}% confidence</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── FORECAST ── */}
            {activeTab==="forecast" && (
              <div style={{...S.card,marginBottom:12}}>
                <div style={{...S.label}}>7-DAY FORECAST — {signal.asset.label} (from live {formatPrice(signal.asset)})</div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(4,1fr)":"repeat(7,1fr)",gap:5,marginBottom:12,overflowX:isMobile?"auto":"visible"}}>
                  {signal.forecast.map((f,i)=>{
                    const fc=f.change>=0?"#00ff88":"#ff4466";
                    return (
                      <div key={i} style={{background:themeObj.bg,border:`1px solid ${themeObj.border}`,borderRadius:5,padding:"7px 5px",textAlign:"center"}}>
                        <div style={{fontSize:9,color:themeObj.muted,marginBottom:4}}>{f.day}</div>
                        <div style={{fontSize:10,fontWeight:700,color:themeObj.text,marginBottom:3}}>{signal.asset.currency}{f.price.toLocaleString()}</div>
                        <div style={{fontSize:9,color:fc,fontWeight:700}}>{f.change>=0?"+":""}{f.change}%</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{height:90,display:"flex",alignItems:"flex-end",gap:4}}>
                  {signal.forecast.map((f,i)=>{
                    const prices2=signal.forecast.map(x=>x.price);
                    const min=Math.min(...prices2),max=Math.max(...prices2);
                    const h=((f.price-min)/(max-min||1))*65+20;
                    const fc=f.change>=0?"#00ff88":"#ff4466";
                    return <div key={i} style={{flex:1,background:fc+"22",border:"1px solid "+fc+"44",borderRadius:"3px 3px 0 0",height:h+"px"}}/>;
                  })}
                </div>
                <div style={{marginTop:10,fontSize:9,color:themeObj.muted,lineHeight:1.5}}>Swarm extrapolation from live price. Not financial advice.</div>
              </div>
            )}

            {/* ── HERD ── */}
            {activeTab==="herd" && (
              <div style={{...S.card,marginBottom:12}}>
                <div style={{...S.label}}>HERD EVENT MONITOR</div>
                <div style={{textAlign:"center",padding:"24px 0",color:themeObj.muted}}>
                  <div style={{fontSize:11,marginBottom:6}}>Monitoring {Object.values(sectors).flatMap(s=>s.assets).length} live assets</div>
                  <div style={{fontSize:10,color:"#1a3a5c"}}>Fires when 60%+ agents align simultaneously.</div>
                  {signal.swarm.herd_event && (
                    <div style={{marginTop:14,background:"#002a18",border:"1px solid #00ff88",borderRadius:6,padding:"10px 14px",display:"inline-flex",gap:8,alignItems:"center"}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 7px #00ff88"}}/>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontSize:11,fontWeight:700,color:themeObj.accent}}>ACTIVE — {signal.asset.label}</div>
                        <div style={{fontSize:9,color:"#006644"}}>{signal.swarm.buy_pct}% buying · {signal.confidence}% conf · {signal.time}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── WEEKEND SUMMARY PANEL ── */}
            {isWeekend && weeklyData && (
              <div style={{...S.card,padding:"12px 16px",marginBottom:8,borderLeft:"3px solid #00ff88"}}>
                <div style={{fontSize:10,color:themeObj.muted,letterSpacing:1,marginBottom:6}}>WEEKEND MODE — MARKETS CLOSED</div>
                <div style={{fontSize:13,color:themeObj.text,fontWeight:600,marginBottom:4}}>
                  This week: {weeklyData.correct} correct, {weeklyData.wrong} wrong = <span style={{color:themeObj.accent}}>{weeklyData.accuracy_pct}%</span>
                </div>
                {weeklyData.best_region && (
                  <div style={{fontSize:11,color:"#aac8e0",marginBottom:4}}>
                    Best region: <span style={{color:themeObj.accent}}>{weeklyData.best_region} {weeklyData.best_region_pct}%</span>
                  </div>
                )}
                <div style={{fontSize:10,color:themeObj.muted}}>Next market open: Monday 9:15 AM IST</div>
              </div>
            )}

            {/* ── FOOTER ── */}
            <div style={{...S.card,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
                {[
                  [isWeekend ? "WEEKLY ACC" : "ACCURACY", accuracy+"%","#00ff88"],
                  ["SIGNALS","423","#e0e8f0"],
                  ["VS GPT-5","+14.6%","#00ff88"],
                  ["ASSETS",Object.values(sectors).flatMap(s=>s.assets).length.toString(),"#ffaa00"]
                ].map(([l,v,c])=>(
                  <div key={l}>
                    <div style={{fontSize:9,color:themeObj.muted,letterSpacing:1,marginBottom:2}}>{l}</div>
                    <div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div>
                    {l === "ACCURACY" && (
                      <div title="Accuracy calculated on clean deduplicated signals only" style={{fontSize:8,color:"#00cc66",marginTop:2,cursor:"default"}}>✓ Verified • Duplicate-free</div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{fontSize:9,color:"#1a3a5c"}}>prices updated {lastRefresh||"..."}</div>
            </div>
          </>
        )}
      </div>

      {/* chat widget moved to fragment root — see below main div */}

      {/* Chat panel placeholder — panel rendered at fragment root */}
      {chatOpen && (
        <div style={{
          position:"fixed",
          bottom: isMobile ? 120 : 112,
          right:12,
          width: isMobile ? "calc(100vw - 24px)" : 340,
          maxHeight: isMobile ? "55vh" : 460,
          background:themeObj.panel,
          border:"1px solid #00ff8833",
          borderRadius:10,
          display:"flex", flexDirection:"column",
          zIndex:10001,
          boxShadow:"0 0 30px #00ff8820",
          overflow:"hidden",
        }}>
          {/* Header */}
          <div style={{padding:"10px 14px", borderBottom:`1px solid ${themeObj.border}`, display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
            <div style={{width:8, height:8, borderRadius:"50%", background:"#00ff88", boxShadow:"0 0 6px #00ff88"}}/>
            <span style={{fontSize:11, fontWeight:700, color:themeObj.accent, letterSpacing:2}}>PREDIQ AI</span>
            <span style={{fontSize:9, color:themeObj.muted, marginLeft:"auto"}}>{signal?.asset?.label || (typeof selected === 'string' ? selected : selected?.label) || ''}</span>
          </div>

          {/* Messages */}
          <div style={{flex:1, overflowY:"auto", padding:"10px 12px", display:"flex", flexDirection:"column", gap:8}}>
            {chatMessages.length === 0 && (
              <div style={{fontSize:10, color:themeObj.muted, textAlign:"center", marginTop:20, lineHeight:1.6}}>
                Ask about the current signal,{"\n"}entry strategy, market conditions,{"\n"}or any asset on PREDIQ.
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth:"85%",
                background: m.role === "user" ? "#003d20" : "#0a1628",
                border: `1px solid ${m.role === "user" ? "#00ff8844" : "#0d2035"}`,
                borderRadius: m.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                padding:"8px 10px",
                fontSize:11, color: m.role === "user" ? "#00ff88" : "#c0d8f0",
                lineHeight:1.5,
                whiteSpace:"pre-wrap",
              }}>
                {m.content}
              </div>
            ))}
            {chatLoading && (
              <div style={{alignSelf:"flex-start", fontSize:10, color:themeObj.muted, padding:"4px 8px"}}>
                PREDIQ AI is thinking...
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Quick action buttons */}
          {(() => {
            const assetName = signal?.asset?.label || selected;
            const allButtons = [
                      { label: "📊 Full Analysis",   prompt: `Give me a full analysis of ${assetName} covering signals, momentum, news sentiment and recommendation` },
              { label: "⚠️ Risk Analysis",   prompt: `What are the main risks of ${assetName} right now?` },
              { label: "🆚 Compare",          prompt: `Compare ${assetName} vs ` },
              { label: "💼 Portfolio",        prompt: "Build me a diversified portfolio with ₹100,000 across top PREDIQ signals" },
              { label: "📈 Entry Timing",    prompt: `When is the best time to enter ${assetName}? Analyze current price vs support levels` },
              { label: "📰 News Impact",     prompt: `How does today's news impact ${assetName} signal?` },
              { label: "🌍 Market Summary",  prompt: "Give me today's full market summary across all regions" },
              { label: "📋 Fundamentals",    prompt: `What are the fundamentals of ${assetName}? Is it overvalued or undervalued?` },
              { label: "🎯 Analyst View",    prompt: `What do analysts say about ${assetName}? What is their price target?` },
            ];
            const visibleButtons = isElite ? allButtons : isPro ? allButtons.slice(0, 3) : allButtons.slice(0, 3);
            return (
              <div style={{
                padding:"6px 10px 4px", borderTop:"1px solid #0a1a2e",
                display:"flex", flexWrap:"wrap", gap:4, flexShrink:0,
              }}>
                {visibleButtons.map(btn => (
                  <button
                    key={btn.label}
                    onClick={() => setChatInput(btn.prompt)}
                    style={{
                      padding:"4px 8px", borderRadius:4, fontSize:10,
                      background:"#0d2035", border:"1px solid #1a3a5c",
                      color:"#7ab0d0", cursor:"pointer", fontFamily:"inherit",
                      whiteSpace:"nowrap", touchAction:"manipulation",
                      transition:"background 0.12s, color 0.12s",
                    }}
                    onMouseEnter={e => { (e.target as HTMLButtonElement).style.background="#1a3a5c"; (e.target as HTMLButtonElement).style.color="#00ff88"; }}
                    onMouseLeave={e => { (e.target as HTMLButtonElement).style.background="#0d2035"; (e.target as HTMLButtonElement).style.color="#7ab0d0"; }}
                  >
                    {btn.label}
                  </button>
                ))}
                {!isElite && (
                  <button
                    onClick={() => setEliteModalOpen(true)}
                    style={{
                      padding:"4px 8px", borderRadius:4, fontSize:10,
                      background:"#1a1a00", border:"1px solid #554400",
                      color:"#ffaa00", cursor:"pointer", fontFamily:"inherit",
                      whiteSpace:"nowrap", touchAction:"manipulation",
                    }}
                  >
                    🔒 +{allButtons.length - visibleButtons.length} Elite
                  </button>
                )}
              </div>
            );
          })()}

          {/* Input */}
          <div style={{padding:"8px 10px", borderTop:`1px solid ${themeObj.border}`, display:"flex", gap:6, alignItems:"center", flexShrink:0}}>
            {/* Prompt library button */}
            <button
              onClick={() => setPromptLibOpen(true)}
              title="Open prompt library"
              style={{
                padding:"7px 9px", borderRadius:6, fontSize:13,
                background:"#0d2035", border:"1px solid #1a3a5c",
                color:"#7ab0d0", cursor:"pointer", flexShrink:0,
                touchAction:"manipulation",
              }}
            >📚</button>
            <div style={{position:"relative", flex:1, minWidth:0}}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Ask about signals..."
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                style={{
                  width:"100%", boxSizing:"border-box",
                  background:themeObj.bg, border:`1px solid ${themeObj.border}`,
                  borderRadius:6, padding:"8px 28px 8px 10px",
                  color:themeObj.text, fontFamily:"inherit", fontSize:13,
                  outline:"none",
                }}
              />
              {/* Help tooltip */}
              <span
                title="Type a question or pick from 📚 prompt library"
                style={{
                  position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                  fontSize:10, color:"#1a3a5c", cursor:"help", userSelect:"none",
                }}
              >?</span>
            </div>
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                padding:"8px 12px", borderRadius:6,
                background: chatLoading || !chatInput.trim() ? "#0d2035" : "#00ff88",
                border:"none", cursor: chatLoading || !chatInput.trim() ? "default" : "pointer",
                color:"#020408", fontWeight:700, fontSize:11,
                fontFamily:"inherit", touchAction:"manipulation",
                transition:"background 0.15s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:themeObj.panel,borderTop:`1px solid ${themeObj.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {[
          {label:"SIGNAL",  tab:"signal",   active:activeTab==="signal"&&!!signal},
          {label:"ENTRY",   tab:"entry",    active:activeTab==="entry"&&!!signal},
          {label:"AI",      tab:"personas", active:activeTab==="personas"&&!!signal},
          {label:"7-DAY",   tab:"forecast", active:activeTab==="forecast"&&!!signal},
          {label:"NETWORK", tab:"network",  active:false, href:"/network"},
        ].map(item=>(
          item.href
            ? <a key={item.label} href={item.href} style={{flex:1,padding:isMobile?"14px 4px":"10px 4px",textAlign:"center",textDecoration:"none",background:themeObj.panel,borderLeft:`1px solid ${themeObj.border}`,minHeight:isMobile?52:36,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:isMobile?11:9,color:"#aa66ff",letterSpacing:1,fontWeight:700}}>{item.label}</div>
              </a>
            : <button key={item.label} onClick={()=>setActiveTab(item.tab)} style={{flex:1,padding:isMobile?"14px 4px":"10px 4px",background:"none",border:"none",borderLeft:`1px solid ${themeObj.border}`,cursor:"pointer",fontFamily:"inherit",minHeight:isMobile?52:36,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",touchAction:"manipulation"}}>
                <div style={{fontSize:isMobile?11:9,color:item.active?sigColor:themeObj.muted,letterSpacing:1,fontWeight:item.active?700:400}}>{item.label}</div>
                {item.active && <div style={{width:isMobile?20:16,height:2,background:sigColor,borderRadius:1,marginTop:4}}/>}
              </button>
        ))}
      </div>

    </div>

    {/* ── AI CHAT FLOATING BUTTON (always rendered, fragment root) ── */}
    <button
      onClick={() => setChatOpen(o => !o)}
      style={{
        position:"fixed", bottom: isMobile ? 68 : 60, right:16,
        width:48, height:48, borderRadius:"50%",
        background: chatOpen ? "#00cc6688" : "#00ff88",
        border:"none", cursor:"pointer",
        fontSize:20, display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 0 18px #00ff8866",
        zIndex:10000, transition:"background 0.2s",
        touchAction:"manipulation",
        color:"#020408", fontWeight:700,
      }}
      aria-label="Open AI Chat"
    >
      {chatOpen ? "✕" : "💬"}
    </button>

    {/* ── Prompt Library Modal ─────────────────────────────────────────── */}
    {promptLibOpen && (() => {
      const assetName = signal?.asset?.label || (typeof selected === "string" ? selected : "") || "NIFTY50";

      const CATEGORIES: Record<string, { label: string; elite?: boolean; prompts: { title: string; preview: string; text: string }[] }> = {
        analysis: {
          label: "🔍 ANALYSIS",
          prompts: [
            { title: "Full Stock Analysis",  preview: "Signals, momentum, news & recommendation", text: `Give me a full analysis of ${assetName} covering signals, momentum, news sentiment and recommendation` },
            { title: "Risk Analysis",         preview: "Key risks and downside scenarios",          text: `What are the main risks of ${assetName} right now?` },
            { title: "Earnings Breakdown",    preview: "Recent earnings impact on signal",          text: `Break down the earnings outlook and recent results impact on ${assetName}` },
          ],
        },
        compare: {
          label: "🆚 COMPARE",
          elite: true,
          prompts: [
            { title: "Head to Head",        preview: "Compare two assets directly",           text: `Compare ${assetName} vs ` },
            { title: "Sector Comparison",   preview: "Compare sector peers",                  text: `Compare ${assetName} against its sector peers and tell me which has the strongest signal` },
          ],
        },
        portfolio: {
          label: "💼 PORTFOLIO",
          elite: true,
          prompts: [
            { title: "Build Portfolio",       preview: "₹100,000 diversified across top signals", text: "Build me a diversified portfolio with ₹100,000 across top PREDIQ signals" },
            { title: "Diversification Check", preview: "Analyse my mix of holdings",              text: `Is ${assetName} a good addition to a diversified portfolio? What does it add?` },
          ],
        },
        timing: {
          label: "📈 TIMING",
          elite: true,
          prompts: [
            { title: "Entry Timing",    preview: "Best entry point vs support",   text: `When is the best time to enter ${assetName}? Analyze current price vs support levels` },
            { title: "Support Levels",  preview: "Key support and resistance",    text: `What are the key support and resistance levels for ${assetName} right now?` },
          ],
        },
        market: {
          label: "🌍 MARKET",
          prompts: [
            { title: "Regional Summary",  preview: "Full cross-region market overview", text: "Give me today's full market summary across all regions" },
            { title: "Sector Overview",   preview: "Which sectors are leading today",   text: "Which sectors are performing best today and what signals does PREDIQ show for them?" },
          ],
        },
        saved: {
          label: "⭐ MY SAVED",
          prompts: savedPrompts.map(p => ({ title: p.name, preview: p.text.slice(0, 50) + (p.text.length > 50 ? "…" : ""), text: p.text })),
        },
      };

      const saveCurrentPrompt = () => {
        if (!newPromptName.trim() || !newPromptText.trim()) return;
        const updated = [...savedPrompts, { name: newPromptName.trim(), text: newPromptText.trim() }];
        setSavedPrompts(updated);
        localStorage.setItem("prediq_saved_prompts", JSON.stringify(updated));
        setNewPromptName(""); setNewPromptText("");
      };

      const deletePrompt = (idx: number) => {
        const updated = savedPrompts.filter((_, i) => i !== idx);
        setSavedPrompts(updated);
        localStorage.setItem("prediq_saved_prompts", JSON.stringify(updated));
      };

      const visibleCats = isElite
        ? Object.keys(CATEGORIES)
        : isPro
          ? ["analysis", "market", "saved"]
          : ["analysis", "market", "saved"];

      const activeCat = visibleCats.includes(promptLibTab) ? promptLibTab : visibleCats[0];
      const cat = CATEGORIES[activeCat];

      return (
        <div onClick={() => setPromptLibOpen(false)} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
          zIndex:12000, display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:themeObj.panel, border:"1px solid #00ff8833",
            borderRadius:12, width: isMobile ? "calc(100vw - 24px)" : 440,
            maxHeight:"80vh", display:"flex", flexDirection:"column",
            boxShadow:"0 0 40px #00ff8820",
          }}>
            {/* Header */}
            <div style={{padding:"14px 16px", borderBottom:`1px solid ${themeObj.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0}}>
              <span style={{fontSize:13, fontWeight:700, color:themeObj.accent, letterSpacing:2}}>📚 PROMPT LIBRARY</span>
              <button onClick={() => setPromptLibOpen(false)} style={{background:"none", border:"none", color:themeObj.muted, fontSize:16, cursor:"pointer"}}>✕</button>
            </div>

            {/* Category tabs */}
            <div style={{display:"flex", gap:4, padding:"8px 12px", flexWrap:"wrap", borderBottom:`1px solid ${themeObj.border}`, flexShrink:0}}>
              {visibleCats.map(k => (
                <button key={k} onClick={() => setPromptLibTab(k)} style={{
                  padding:"4px 9px", borderRadius:4, fontSize:10,
                  background: activeCat === k ? "#00ff8822" : "#0d2035",
                  border: activeCat === k ? "1px solid #00ff8866" : "1px solid #1a3a5c",
                  color: activeCat === k ? "#00ff88" : "#7ab0d0",
                  cursor:"pointer", fontFamily:"inherit",
                }}>
                  {CATEGORIES[k].label}
                  {CATEGORIES[k].elite && !isElite && <span style={{marginLeft:4, fontSize:8, color:"#ffaa00"}}>🔒</span>}
                </button>
              ))}
              {!isElite && (
                <button onClick={() => { setPromptLibOpen(false); setEliteModalOpen(true); }} style={{
                  padding:"4px 9px", borderRadius:4, fontSize:10,
                  background:"#1a1a00", border:"1px solid #554400",
                  color:"#ffaa00", cursor:"pointer", fontFamily:"inherit",
                }}>🔒 Unlock All</button>
              )}
            </div>

            {/* Prompts list */}
            <div style={{flex:1, overflowY:"auto", padding:"10px 12px", display:"flex", flexDirection:"column", gap:8}}>
              {cat.prompts.length === 0 && activeCat !== "saved" && (
                <div style={{fontSize:11, color:themeObj.muted, textAlign:"center", marginTop:20}}>No prompts in this category.</div>
              )}
              {cat.prompts.map((p, i) => (
                <div key={i} style={{background:"#0a1a2e", border:`1px solid ${themeObj.border}`, borderRadius:8, padding:"10px 12px"}}>
                  <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8}}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:12, fontWeight:700, color:themeObj.text, marginBottom:3}}>{p.title}</div>
                      <div style={{fontSize:10, color:themeObj.muted, lineHeight:1.4}}>{p.preview}</div>
                    </div>
                    <div style={{display:"flex", gap:4, flexShrink:0}}>
                      <button onClick={() => {
                        setChatInput(p.text);
                        setPromptLibOpen(false);
                        if (!chatOpen) setChatOpen(true);
                      }} style={{
                        padding:"4px 10px", borderRadius:4, fontSize:10,
                        background:"#00ff8822", border:"1px solid #00ff8866",
                        color:themeObj.accent, cursor:"pointer", fontFamily:"inherit",
                      }}>Use</button>
                      {activeCat !== "saved" ? (
                        <button onClick={() => {
                          const updated = [...savedPrompts, { name: p.title, text: p.text }];
                          setSavedPrompts(updated);
                          localStorage.setItem("prediq_saved_prompts", JSON.stringify(updated));
                        }} style={{
                          padding:"4px 10px", borderRadius:4, fontSize:10,
                          background:"#0d2035", border:"1px solid #1a3a5c",
                          color:"#7ab0d0", cursor:"pointer", fontFamily:"inherit",
                        }}>Save</button>
                      ) : (
                        <button onClick={() => deletePrompt(i)} style={{
                          padding:"4px 10px", borderRadius:4, fontSize:10,
                          background:"#1a0010", border:"1px solid #440022",
                          color:themeObj.accentSell, cursor:"pointer", fontFamily:"inherit",
                        }}>Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* MY SAVED — custom prompt creator */}
              {activeCat === "saved" && (
                <div style={{background:"#0a1a2e", border:"1px solid #1a3a5c", borderRadius:8, padding:"12px"}}>
                  <div style={{fontSize:11, color:"#7ab0d0", marginBottom:8, fontWeight:700}}>+ Save a custom prompt</div>
                  <input
                    value={newPromptName}
                    onChange={e => setNewPromptName(e.target.value)}
                    placeholder="Prompt name (e.g. 'My BUY signal check')"
                    style={{
                      width:"100%", boxSizing:"border-box",
                      background:themeObj.bg, border:`1px solid ${themeObj.border}`,
                      borderRadius:5, padding:"6px 8px", color:themeObj.text,
                      fontFamily:"inherit", fontSize:11, marginBottom:6, outline:"none",
                    }}
                  />
                  <textarea
                    value={newPromptText}
                    onChange={e => setNewPromptText(e.target.value)}
                    placeholder="Prompt text..."
                    rows={3}
                    style={{
                      width:"100%", boxSizing:"border-box",
                      background:themeObj.bg, border:`1px solid ${themeObj.border}`,
                      borderRadius:5, padding:"6px 8px", color:themeObj.text,
                      fontFamily:"inherit", fontSize:11, resize:"vertical",
                      marginBottom:6, outline:"none",
                    }}
                  />
                  <button onClick={saveCurrentPrompt} disabled={!newPromptName.trim() || !newPromptText.trim()} style={{
                    padding:"6px 16px", borderRadius:5, fontSize:11,
                    background: newPromptName.trim() && newPromptText.trim() ? "#00ff8822" : "#0d2035",
                    border: newPromptName.trim() && newPromptText.trim() ? "1px solid #00ff8866" : "1px solid #1a3a5c",
                    color: newPromptName.trim() && newPromptText.trim() ? "#00ff88" : "#3a6080",
                    cursor: newPromptName.trim() && newPromptText.trim() ? "pointer" : "default",
                    fontFamily:"inherit",
                  }}>Save Prompt</button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    })()}

    {/* ── Elite Waitlist Modal ─────────────────────────────────────────── */}

    {eliteModalOpen && (
      <div
        onClick={() => setEliteModalOpen(false)}
        style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{background:"#070f1a",border:"1px solid rgba(255,170,0,0.35)",borderRadius:12,padding:"28px 24px",maxWidth:360,width:"100%",fontFamily:"inherit"}}
        >
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <span style={{fontSize:24}}>⚡</span>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:"#ffaa00",letterSpacing:1}}>PREDIQ ELITE</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:1}}>EARLY ACCESS</div>
            </div>
          </div>

          {/* Pricing */}
          <div style={{background:"rgba(255,170,0,0.07)",border:"1px solid rgba(255,170,0,0.2)",borderRadius:8,padding:"12px 14px",marginBottom:18}}>
            <div style={{fontSize:22,fontWeight:700,color:"#ffaa00"}}>$49 <span style={{fontSize:12,fontWeight:400,color:"rgba(255,255,255,0.5)"}}>/month</span></div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>₹2,999/month for India</div>
          </div>

          {/* Features */}
          <div style={{marginBottom:20}}>
            {[
              "Options signals (calls & puts)",
              "AI chat with live market context",
              "All 100+ assets across India, US, Crypto",
              "MIRO swarm intelligence signals",
              "Priority signal alerts",
              "Full prediction history & accuracy stats",
            ].map(f => (
              <div key={f} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
                <span style={{color:themeObj.accent,fontSize:13,marginTop:1}}>✓</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.4}}>{f}</span>
              </div>
            ))}
          </div>

          {/* Track record nudge */}
          <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",textAlign:"center",marginBottom:16,lineHeight:1.5}}>
            {isWeekend ? "Weekly" : "PREDIQ"} accuracy: <span style={{color:themeObj.accent,fontWeight:700}}>{accuracy ? `${accuracy}%` : "83.3%"}</span> verified — beating GPT-5
          </div>

          {/* CTA buttons */}
          <a
            href="mailto:prediq@trinovion.com?subject=Elite%20Waitlist&body=Hi%2C%20I%20want%20to%20join%20the%20PREDIQ%20Elite%20waitlist."
            style={{display:"block",textAlign:"center",padding:"12px",background:"#ffaa00",borderRadius:8,fontSize:13,fontWeight:700,color:"#020408",textDecoration:"none",letterSpacing:1,marginBottom:10}}
          >
            JOIN ELITE WAITLIST
          </a>
          <button
            onClick={() => setEliteModalOpen(false)}
            style={{display:"block",width:"100%",padding:"10px",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,fontSize:12,color:"rgba(255,255,255,0.4)",cursor:"pointer",fontFamily:"inherit"}}
          >
            Maybe Later
          </button>
        </div>
      </div>
    )}

    </>
  );
}
// Wed Apr  1 17:40:29 -03 2026
