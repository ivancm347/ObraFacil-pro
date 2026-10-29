import { useState, useEffect } from 'react'
import Painel from './pages/Painel'
import Orcamentos from './pages/Orcamentos'
import Produtos from './pages/Produtos'
import Clientes from './pages/Clientes'
import Obras from './pages/Obras'
import Configuracoes from './pages/Configuracoes'
import AssistenteInteligente from './pages/AssistenteInteligente'
import OfertasAfiliadas from './pages/OfertasAfiliadas'
import Icon from './components/Icon.jsx'
import { supabase, supabaseConfigured } from './lib/supabase.js'

const SEED = [
  { id: 'prod-1', nome: 'Placa Drywall ST 12.5mm 1.20x1.80m', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0001', preco: 28.9 },
  { id: 'prod-2', nome: 'Placa Drywall RU Verde 12.5mm', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0002', preco: 38.5 },
  { id: 'prod-3', nome: 'Placa Drywall RF Rosa 12.5mm', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0003', preco: 42.0 },
  { id: 'prod-4', nome: 'Placa Cimentícia 8mm 1.20x2.40m', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0004', preco: 89.9 },
  { id: 'prod-5', nome: 'Placa OSB 11.1mm 1.20x2.40m', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0005', preco: 115.0 },
  { id: 'prod-6', nome: 'Forro Drywall 12.5mm removível', categoria: 'Drywall', unidade: 'm²', codigo: 'COD-0006', preco: 32.0 },
  { id: 'prod-7', nome: 'Forro Mineral 625x1250mm', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0007', preco: 45.0 },
  { id: 'prod-8', nome: 'Sanca Aberta Drywall m linear', categoria: 'Drywall', unidade: 'm', codigo: 'COD-0008', preco: 35.0 },
  { id: 'prod-9', nome: 'Sanca Fechada Drywall m linear', categoria: 'Drywall', unidade: 'm', codigo: 'COD-0009', preco: 28.0 },
  { id: 'prod-10', nome: 'Cortineiro Drywall m linear', categoria: 'Drywall', unidade: 'm', codigo: 'COD-0010', preco: 42.0 },
  { id: 'prod-11', nome: 'Moldura Drywall 10cm m linear', categoria: 'Drywall', unidade: 'm', codigo: 'COD-0011', preco: 18.5 },
  { id: 'prod-12', nome: 'Parede Drywall ST simples m²', categoria: 'Drywall', unidade: 'm²', codigo: 'COD-0012', preco: 95.0 },
  { id: 'prod-13', nome: 'Parede Drywall RU banheiro m²', categoria: 'Drywall', unidade: 'm²', codigo: 'COD-0013', preco: 125.0 },
  { id: 'prod-14', nome: 'Parede Drywall acústica m²', categoria: 'Drywall', unidade: 'm²', codigo: 'COD-0014', preco: 145.0 },
  { id: 'prod-15', nome: 'Divisória Drywall Naval m²', categoria: 'Drywall', unidade: 'm²', codigo: 'COD-0015', preco: 110.0 },
  { id: 'prod-16', nome: 'Isolamento Acústico Lã de Vidro 50mm', categoria: 'Drywall', unidade: 'm²', codigo: 'COD-0016', preco: 18.0 },
  { id: 'prod-17', nome: 'Isolamento Lã de Rocha 50mm', categoria: 'Drywall', unidade: 'm²', codigo: 'COD-0017', preco: 24.5 },
  { id: 'prod-18', nome: 'Isolamento Lã de PET 50mm', categoria: 'Drywall', unidade: 'm²', codigo: 'COD-0018', preco: 22.0 },
  { id: 'prod-19', nome: 'Fita Acústica Banda 20m', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0019', preco: 16.9 },
  { id: 'prod-20', nome: 'Cantoneira Perfurada 25x25 3m', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0020', preco: 8.9 },
  { id: 'prod-21', nome: 'Tabica Metálica 3m', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0021', preco: 12.5 },
  { id: 'prod-22', nome: 'Alçapão Drywall 40x40cm', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0022', preco: 65.0 },
  { id: 'prod-23', nome: 'Alçapão Drywall 60x60cm', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0023', preco: 95.0 },
  { id: 'prod-24', nome: 'Buja Drywall 6mm', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0024', preco: 0.35 },
  { id: 'prod-25', nome: 'Buja Drywall 8mm c/ parafuso', categoria: 'Drywall', unidade: 'un', codigo: 'COD-0025', preco: 0.85 },
  { id: 'prod-26', nome: 'Perfil Montante 48mm 3m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0026', preco: 9.8 },
  { id: 'prod-27', nome: 'Perfil Montante 70mm 3m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0027', preco: 12.9 },
  { id: 'prod-28', nome: 'Perfil Montante 90mm 3m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0028', preco: 15.5 },
  { id: 'prod-29', nome: 'Perfil Guia 48mm 3m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0029', preco: 8.5 },
  { id: 'prod-30', nome: 'Perfil Guia 70mm 3m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0030', preco: 11.2 },
  { id: 'prod-31', nome: 'Perfil Guia 90mm 3m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0031', preco: 13.8 },
  { id: 'prod-32', nome: 'Perfil F530 3m forro', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0032', preco: 10.5 },
  { id: 'prod-33', nome: 'Perfil F530 Longarina 3m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0033', preco: 11.0 },
  { id: 'prod-34', nome: 'Perfil Cantoneira 25x30 3m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0034', preco: 6.8 },
  { id: 'prod-35', nome: 'Perfil Tabica L 3m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0035', preco: 9.9 },
  { id: 'prod-36', nome: 'Suporte Nivelador F530', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0036', preco: 1.2 },
  { id: 'prod-37', nome: 'Pendural F530', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0037', preco: 0.95 },
  { id: 'prod-38', nome: 'Emenda F530', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0038', preco: 0.85 },
  { id: 'prod-39', nome: 'Suporte Tipo L para forro', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0039', preco: 2.1 },
  { id: 'prod-40', nome: 'Perfil Click 3m forro removível', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0040', preco: 18.0 },
  { id: 'prod-41', nome: 'Travessa Click 1.25m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0041', preco: 6.5 },
  { id: 'prod-42', nome: 'Travessa Click 0.625m', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0042', preco: 4.2 },
  { id: 'prod-43', nome: 'Cantoneira Parede 3m forro', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0043', preco: 7.5 },
  { id: 'prod-44', nome: 'Perfil Steel Frame Montante 90mm', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0044', preco: 28.0 },
  { id: 'prod-45', nome: 'Perfil Steel Frame Guia 90mm', categoria: 'Perfis', unidade: 'un', codigo: 'COD-0045', preco: 24.0 },
  { id: 'prod-46', nome: 'Parafuso GN25 3.5x25mm cx 1000un', categoria: 'Parafusos', unidade: 'cx', codigo: 'COD-0046', preco: 65.0 },
  { id: 'prod-47', nome: 'Parafuso GN35 3.5x35mm cx 1000un', categoria: 'Parafusos', unidade: 'cx', codigo: 'COD-0047', preco: 72.0 },
  { id: 'prod-48', nome: 'Parafuso GN45 3.5x45mm cx 500un', categoria: 'Parafusos', unidade: 'cx', codigo: 'COD-0048', preco: 68.0 },
  { id: 'prod-49', nome: 'Parafuso TA25 4.2x25mm ponta agulha cx 500', categoria: 'Parafusos', unidade: 'cx', codigo: 'COD-0049', preco: 58.0 },
  { id: 'prod-50', nome: 'Parafuso Metal/Metal 4.2x13mm cx 1000', categoria: 'Parafusos', unidade: 'cx', codigo: 'COD-0050', preco: 45.0 },
  { id: 'prod-51', nome: 'Parafuso Sextavado 6x60mm c/ bucha', categoria: 'Parafusos', unidade: 'un', codigo: 'COD-0051', preco: 1.2 },
  { id: 'prod-52', nome: 'Bucha S8 com parafuso', categoria: 'Parafusos', unidade: 'un', codigo: 'COD-0052', preco: 0.45 },
  { id: 'prod-53', nome: 'Bucha S10 com parafuso', categoria: 'Parafusos', unidade: 'un', codigo: 'COD-0053', preco: 0.65 },
  { id: 'prod-54', nome: 'Pino e Bucha 6mm', categoria: 'Parafusos', unidade: 'un', codigo: 'COD-0054', preco: 0.25 },
  { id: 'prod-55', nome: 'Fita Telada 50mm 90m', categoria: 'Parafusos', unidade: 'un', codigo: 'COD-0055', preco: 28.0 },
  { id: 'prod-56', nome: 'Fita Telada 50mm 150m', categoria: 'Parafusos', unidade: 'un', codigo: 'COD-0056', preco: 42.0 },
  { id: 'prod-57', nome: 'Fita Papel 50mm 150m', categoria: 'Parafusos', unidade: 'un', codigo: 'COD-0057', preco: 18.0 },
  { id: 'prod-58', nome: 'Canto Vinílico com fita 30m', categoria: 'Parafusos', unidade: 'un', codigo: 'COD-0058', preco: 85.0 },
  { id: 'prod-59', nome: 'Massa Drywall 25kg', categoria: 'Massas', unidade: 'sc', codigo: 'COD-0059', preco: 89.0 },
  { id: 'prod-60', nome: 'Massa Drywall 6kg', categoria: 'Massas', unidade: 'un', codigo: 'COD-0060', preco: 32.0 },
  { id: 'prod-61', nome: 'Massa Corrida PVA 25kg', categoria: 'Massas', unidade: 'sc', codigo: 'COD-0061', preco: 52.0 },
  { id: 'prod-62', nome: 'Massa Acrílica 25kg', categoria: 'Massas', unidade: 'sc', codigo: 'COD-0062', preco: 78.0 },
  { id: 'prod-63', nome: 'Massa Niveladora Anidro 20kg', categoria: 'Massas', unidade: 'sc', codigo: 'COD-0063', preco: 42.0 },
  { id: 'prod-64', nome: 'Rejunte Flexível 1kg branco', categoria: 'Massas', unidade: 'kg', codigo: 'COD-0064', preco: 8.5 },
  { id: 'prod-65', nome: 'Rejunte Acrílico 1kg', categoria: 'Massas', unidade: 'kg', codigo: 'COD-0065', preco: 18.9 },
  { id: 'prod-66', nome: 'Gesso em Pó 40kg', categoria: 'Massas', unidade: 'sc', codigo: 'COD-0066', preco: 38.0 },
  { id: 'prod-67', nome: 'Gesso Cola 5kg', categoria: 'Massas', unidade: 'un', codigo: 'COD-0067', preco: 24.0 },
  { id: 'prod-68', nome: 'Tinta Acrílica Fosca 18L Branco', categoria: 'Tintas', unidade: 'lata', codigo: 'COD-0068', preco: 289.0 },
  { id: 'prod-69', nome: 'Tinta Acrílica Semi Brilho 18L', categoria: 'Tintas', unidade: 'lata', codigo: 'COD-0069', preco: 345.0 },
  { id: 'prod-70', nome: 'Tinta PVA 18L Branco', categoria: 'Tintas', unidade: 'lata', codigo: 'COD-0070', preco: 189.0 },
  { id: 'prod-71', nome: 'Tinta Esmalte Sintético 3.6L Branco', categoria: 'Tintas', unidade: 'gl', codigo: 'COD-0071', preco: 89.0 },
  { id: 'prod-72', nome: 'Selador Acrílico 18L', categoria: 'Tintas', unidade: 'lata', codigo: 'COD-0072', preco: 125.0 },
  { id: 'prod-73', nome: 'Fundo Preparador 18L', categoria: 'Tintas', unidade: 'lata', codigo: 'COD-0073', preco: 145.0 },
  { id: 'prod-74', nome: 'Verniz Marítimo 3.6L', categoria: 'Tintas', unidade: 'gl', codigo: 'COD-0074', preco: 95.0 },
  { id: 'prod-75', nome: 'Lixa Massa 120', categoria: 'Tintas', unidade: 'un', codigo: 'COD-0075', preco: 1.2 },
  { id: 'prod-76', nome: 'Lixa Massa 150', categoria: 'Tintas', unidade: 'un', codigo: 'COD-0076', preco: 1.2 },
  { id: 'prod-77', nome: 'Lixa Massa 220', categoria: 'Tintas', unidade: 'un', codigo: 'COD-0077', preco: 1.3 },
  { id: 'prod-78', nome: 'Rolo Lã 23cm', categoria: 'Tintas', unidade: 'un', codigo: 'COD-0078', preco: 18.0 },
  { id: 'prod-79', nome: 'Pincel 2 polegadas', categoria: 'Tintas', unidade: 'un', codigo: 'COD-0079', preco: 8.5 },
  { id: 'prod-80', nome: 'Bandeja Pintura Grande', categoria: 'Tintas', unidade: 'un', codigo: 'COD-0080', preco: 12.0 },
  { id: 'prod-81', nome: 'Cimento CP II 50kg', categoria: 'Cimento', unidade: 'sc', codigo: 'COD-0081', preco: 38.5 },
  { id: 'prod-82', nome: 'Cimento CP III 50kg', categoria: 'Cimento', unidade: 'sc', codigo: 'COD-0082', preco: 36.0 },
  { id: 'prod-83', nome: 'Argamassa AC1 20kg', categoria: 'Cimento', unidade: 'sc', codigo: 'COD-0083', preco: 18.9 },
  { id: 'prod-84', nome: 'Argamassa AC2 20kg', categoria: 'Cimento', unidade: 'sc', codigo: 'COD-0084', preco: 28.5 },
  { id: 'prod-85', nome: 'Argamassa AC3 20kg', categoria: 'Cimento', unidade: 'sc', codigo: 'COD-0085', preco: 42.0 },
  { id: 'prod-86', nome: 'Argamassa Piso sobre Piso 20kg', categoria: 'Cimento', unidade: 'sc', codigo: 'COD-0086', preco: 48.0 },
  { id: 'prod-87', nome: 'Rejunte Cerâmico Flex 5kg', categoria: 'Cimento', unidade: 'sc', codigo: 'COD-0087', preco: 32.0 },
  { id: 'prod-88', nome: 'Areia Fina m³', categoria: 'Areia', unidade: 'm³', codigo: 'COD-0088', preco: 180.0 },
  { id: 'prod-89', nome: 'Areia Média m³', categoria: 'Areia', unidade: 'm³', codigo: 'COD-0089', preco: 175.0 },
  { id: 'prod-90', nome: 'Areia Grossa m³', categoria: 'Areia', unidade: 'm³', codigo: 'COD-0090', preco: 170.0 },
  { id: 'prod-91', nome: 'Brita 0 m³', categoria: 'Brita', unidade: 'm³', codigo: 'COD-0091', preco: 190.0 },
  { id: 'prod-92', nome: 'Brita 1 m³', categoria: 'Brita', unidade: 'm³', codigo: 'COD-0092', preco: 185.0 },
  { id: 'prod-93', nome: 'Pedra Britada m³', categoria: 'Brita', unidade: 'm³', codigo: 'COD-0093', preco: 195.0 },
  { id: 'prod-94', nome: 'Bloco Cerâmico 9x19x19 un', categoria: 'Blocos', unidade: 'un', codigo: 'COD-0094', preco: 1.15 },
  { id: 'prod-95', nome: 'Bloco Concreto 14x19x39 un', categoria: 'Blocos', unidade: 'un', codigo: 'COD-0095', preco: 3.2 },
  { id: 'prod-96', nome: 'Tijolinho Comum un', categoria: 'Blocos', unidade: 'un', codigo: 'COD-0096', preco: 0.85 },
  { id: 'prod-97', nome: 'Cal Hidratada 20kg', categoria: 'Cimento', unidade: 'sc', codigo: 'COD-0097', preco: 18.0 },
  { id: 'prod-98', nome: 'Gesso Cola para Bloco 20kg', categoria: 'Cimento', unidade: 'sc', codigo: 'COD-0098', preco: 35.0 },
  { id: 'prod-99', nome: 'Concreto Usinado 20MPA m³', categoria: 'Cimento', unidade: 'm³', codigo: 'COD-0099', preco: 420.0 },
  { id: 'prod-100', nome: 'Laje Pré-moldada m²', categoria: 'Lajes', unidade: 'm²', codigo: 'COD-0100', preco: 68.0 },
  { id: 'prod-101', nome: 'Cabo Flex 1.5mm 100m', categoria: 'Elétrica', unidade: 'rolo', codigo: 'COD-0101', preco: 125.0 },
  { id: 'prod-102', nome: 'Cabo Flex 2.5mm 100m', categoria: 'Elétrica', unidade: 'rolo', codigo: 'COD-0102', preco: 189.0 },
  { id: 'prod-103', nome: 'Cabo Flex 4.0mm 100m', categoria: 'Elétrica', unidade: 'rolo', codigo: 'COD-0103', preco: 289.0 },
  { id: 'prod-104', nome: 'Cabo Flex 6.0mm 100m', categoria: 'Elétrica', unidade: 'rolo', codigo: 'COD-0104', preco: 425.0 },
  { id: 'prod-105', nome: 'Tomada 10A 2P+T', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0105', preco: 8.5 },
  { id: 'prod-106', nome: 'Interruptor Simples', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0106', preco: 9.0 },
  { id: 'prod-107', nome: 'Interruptor Duplo', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0107', preco: 14.5 },
  { id: 'prod-108', nome: 'Disjuntor 10A', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0108', preco: 12.0 },
  { id: 'prod-109', nome: 'Disjuntor 20A', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0109', preco: 12.0 },
  { id: 'prod-110', nome: 'Quadro Distribuição 12 disjuntores', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0110', preco: 65.0 },
  { id: 'prod-111', nome: 'Fita Isolante 10m', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0111', preco: 4.5 },
  { id: 'prod-112', nome: 'Conduíte Corrugado 25mm 50m', categoria: 'Elétrica', unidade: 'rolo', codigo: 'COD-0112', preco: 55.0 },
  { id: 'prod-113', nome: 'Lâmpada LED 9W', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0113', preco: 6.9 },
  { id: 'prod-114', nome: 'Lâmpada LED 12W', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0114', preco: 8.9 },
  { id: 'prod-115', nome: 'Spot LED Embutir 5W', categoria: 'Elétrica', unidade: 'un', codigo: 'COD-0115', preco: 18.5 },
  { id: 'prod-116', nome: 'Tubo PVC Esgoto 100mm 6m', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0116', preco: 68.0 },
  { id: 'prod-117', nome: 'Tubo PVC Soldável 25mm 6m', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0117', preco: 28.0 },
  { id: 'prod-118', nome: 'Joelho 90º Esgoto 100mm', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0118', preco: 8.5 },
  { id: 'prod-119', nome: 'Joelho Soldável 25mm', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0119', preco: 1.2 },
  { id: 'prod-120', nome: 'Registro Esfera 25mm', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0120', preco: 18.0 },
  { id: 'prod-121', nome: 'Torneira Lavatório Bica Alta', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0121', preco: 89.0 },
  { id: 'prod-122', nome: 'Vaso Sanitário com Caixa', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0122', preco: 345.0 },
  { id: 'prod-123', nome: 'Chuveiro Elétrico 5500W', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0123', preco: 65.0 },
  { id: 'prod-124', nome: 'Sifão Flexível Universal', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0124', preco: 12.0 },
  { id: 'prod-125', nome: 'Fita Veda Rosca 10m', categoria: 'Hidráulica', unidade: 'un', codigo: 'COD-0125', preco: 3.5 },
  { id: 'prod-126', nome: 'Parafusadeira Drywall 520W', categoria: 'Ferramentas', unidade: 'un', codigo: 'COD-0126', preco: 389.0 },
  { id: 'prod-127', nome: 'Serra Copo Drywall Kit', categoria: 'Ferramentas', unidade: 'un', codigo: 'COD-0127', preco: 45.0 },
  { id: 'prod-128', nome: 'Estilete Profissional', categoria: 'Ferramentas', unidade: 'un', codigo: 'COD-0128', preco: 18.0 },
  { id: 'prod-129', nome: 'Trena 5m', categoria: 'Ferramentas', unidade: 'un', codigo: 'COD-0129', preco: 22.0 },
  { id: 'prod-130', nome: 'Nível a Laser', categoria: 'Ferramentas', unidade: 'un', codigo: 'COD-0130', preco: 189.0 },
  { id: 'prod-131', nome: 'Desempenadeira Aço 12x25cm', categoria: 'Ferramentas', unidade: 'un', codigo: 'COD-0131', preco: 24.0 },
  { id: 'prod-132', nome: 'Lixadeira Telescópica Drywall', categoria: 'Ferramentas', unidade: 'un', codigo: 'COD-0132', preco: 145.0 },
  { id: 'prod-133', nome: 'Andaime Tubular 1x1.5m', categoria: 'Ferramentas', unidade: 'un', codigo: 'COD-0133', preco: 285.0 },
  { id: 'prod-134', nome: 'Caçamba Entulho 3m³ diária', categoria: 'Serviços', unidade: 'diária', codigo: 'COD-0134', preco: 250.0 },
  { id: 'prod-135', nome: 'EPI Kit Completo', categoria: 'Ferramentas', unidade: 'kit', codigo: 'COD-0135', preco: 85.0 },
  { id: 'prod-136', nome: 'Instalação Drywall Parede m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0136', preco: 65.0 },
  { id: 'prod-137', nome: 'Instalação Forro Drywall m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0137', preco: 55.0 },
  { id: 'prod-138', nome: 'Instalação Forro Mineral m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0138', preco: 45.0 },
  { id: 'prod-139', nome: 'Instalação Cimentícia Fachada m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0139', preco: 95.0 },
  { id: 'prod-140', nome: 'Emassamento Drywall m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0140', preco: 18.0 },
  { id: 'prod-141', nome: 'Pintura PVA m² 2 demãos', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0141', preco: 22.0 },
  { id: 'prod-142', nome: 'Pintura Acrílica m² 2 demãos', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0142', preco: 28.0 },
  { id: 'prod-143', nome: 'Pintura Esmalte Porta un', categoria: 'Serviços', unidade: 'un', codigo: 'COD-0143', preco: 85.0 },
  { id: 'prod-144', nome: 'Aplicação Textura m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0144', preco: 32.0 },
  { id: 'prod-145', nome: 'Assentamento Piso Cerâmico m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0145', preco: 45.0 },
  { id: 'prod-146', nome: 'Assentamento Porcelanato m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0146', preco: 65.0 },
  { id: 'prod-147', nome: 'Rejunte Piso m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0147', preco: 12.0 },
  { id: 'prod-148', nome: 'Instalação Elétrica ponto', categoria: 'Serviços', unidade: 'pt', codigo: 'COD-0148', preco: 85.0 },
  { id: 'prod-149', nome: 'Instalação Hidráulica ponto', categoria: 'Serviços', unidade: 'pt', codigo: 'COD-0149', preco: 95.0 },
  { id: 'prod-150', nome: 'Pedreiro diária', categoria: 'Mão de Obra', unidade: 'diária', codigo: 'COD-0150', preco: 180.0 },
  { id: 'prod-151', nome: 'Ajudante diária', categoria: 'Mão de Obra', unidade: 'diária', codigo: 'COD-0151', preco: 90.0 },
  { id: 'prod-152', nome: 'Pintor diária', categoria: 'Mão de Obra', unidade: 'diária', codigo: 'COD-0152', preco: 160.0 },
  { id: 'prod-153', nome: 'Eletricista diária', categoria: 'Mão de Obra', unidade: 'diária', codigo: 'COD-0153', preco: 200.0 },
  { id: 'prod-154', nome: 'Encanador diária', categoria: 'Mão de Obra', unidade: 'diária', codigo: 'COD-0154', preco: 200.0 },
  { id: 'prod-155', nome: 'Gesseiro diária', categoria: 'Mão de Obra', unidade: 'diária', codigo: 'COD-0155', preco: 190.0 },
  { id: 'prod-156', nome: 'Instalador Drywall diária', categoria: 'Mão de Obra', unidade: 'diária', codigo: 'COD-0156', preco: 210.0 },
  { id: 'prod-157', nome: 'Limpeza Pós Obra m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0157', preco: 8.0 },
  { id: 'prod-158', nome: 'Remoção Entulho m³', categoria: 'Serviços', unidade: 'm³', codigo: 'COD-0158', preco: 85.0 },
  { id: 'prod-159', nome: 'Impermeabilização m²', categoria: 'Serviços', unidade: 'm²', codigo: 'COD-0159', preco: 42.0 },
  { id: 'prod-160', nome: 'Projeto 3D + Medição', categoria: 'Serviços', unidade: 'un', codigo: 'COD-0160', preco: 350.0 },
]

export default function App() {
  const [pagina, setPagina] = useState('painel')
  const [temaEscuro, setTemaEscuro] = useState(false)
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [obras, setObras] = useState([])
  const [orcamentos, setOrcamentos] = useState([])
  const [empresa, setEmpresa] = useState({ nome: 'ObraFacil PRO', telefone: '(13) 99999-9999', cnpj: '', pix: '', endereco: '', logo: '' })
  const [notificacao, setNotificacao] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [licenciado, setLicenciado] = useState(false)
  const [authPronto, setAuthPronto] = useState(!supabaseConfigured)
  const [dadosCarregados, setDadosCarregados] = useState(false)
  const [cloudReady, setCloudReady] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modoAuth, setModoAuth] = useState('login')
  const [authErro, setAuthErro] = useState('')
  const [authMensagem, setAuthMensagem] = useState('')

  const lerLocal = () => {
    const ler = (chave, padrao) => {
      try {
        const valor = localStorage.getItem(chave)
        return valor === null ? padrao : JSON.parse(valor)
      } catch {
        return padrao
      }
    }
    return {
      produtos: ler('obrafacil_produtos', SEED),
      clientes: ler('obrafacil_clientes', []),
      orcamentos: ler('obrafacil_orcamentos', []),
      obras: ler('obrafacil_obras', []),
      empresa: ler('obrafacil_empresa', { nome: 'ObraFacil PRO', telefone: '(13) 99999-9999', cnpj: '', pix: '', endereco: '', logo: '' })
    }
  }

  const aplicarDados = (dados) => {
    setProdutos(Array.isArray(dados?.produtos) ? dados.produtos : SEED)
    setClientes(Array.isArray(dados?.clientes) ? dados.clientes : [])
    setOrcamentos(Array.isArray(dados?.orcamentos) ? dados.orcamentos : [])
    setObras(Array.isArray(dados?.obras) ? dados.obras : [])
    setEmpresa(dados?.empresa && typeof dados.empresa === 'object'
      ? dados.empresa
      : { nome: 'ObraFacil PRO', telefone: '(13) 99999-9999', cnpj: '', pix: '', endereco: '', logo: '' })
  }

  useEffect(() => {
    if (!supabaseConfigured) {
      aplicarDados(lerLocal())
      setDadosCarregados(true)
      return
    }

    let ativo = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return
      if (error) setAuthErro('Não foi possível verificar a sessão. Tente atualizar a página.')
      const sessaoUsuario = data?.session?.user ?? null
      setUsuario(sessaoUsuario)
      if (!sessaoUsuario) {
        aplicarDados(lerLocal())
        setDadosCarregados(true)
        setCloudReady(false)
      }
      setAuthPronto(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (!ativo) return
      setUsuario(sessao?.user ?? null)
      setAuthPronto(true)
      if (!sessao) {
        aplicarDados(lerLocal())
        setDadosCarregados(true)
        setCloudReady(false)
      }
    })

    return () => {
      ativo = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let ativo = true
    const verificarLicenca = async () => {
      if (!supabaseConfigured || !usuario) { if (ativo) setLicenciado(false); return }
      const { data, error } = await supabase.rpc('obrafacil_tem_licenca')
      if (ativo) setLicenciado(!error && data === true)
    }
    verificarLicenca().catch(() => { if (ativo) setLicenciado(false) })
    return () => { ativo = false }
  }, [usuario])

  useEffect(() => {
    if (!supabaseConfigured || !authPronto || !usuario) return
    let ativo = true
    setDadosCarregados(false)
    setCloudReady(false)
    setAuthErro('')

    const carregar = async () => {
      const { data, error } = await supabase
        .from('obrafacil_dados')
        .select('payload')
        .eq('user_id', usuario.id)
        .maybeSingle()

      if (!ativo) return
      if (error) {
        aplicarDados(lerLocal())
        setAuthErro('A conta entrou, mas o banco ainda não respondeu. Confira se executou o arquivo supabase/schema.sql no Supabase. Seus dados locais foram mantidos.')
        setDadosCarregados(true)
        return
      }

      if (data?.payload && typeof data.payload === 'object') {
        aplicarDados(data.payload)
      } else {
        const locais = lerLocal()
        aplicarDados(locais)
        const { error: gravacaoErro } = await supabase.from('obrafacil_dados').upsert({
          user_id: usuario.id,
          payload: locais,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        if (!ativo) return
        if (gravacaoErro) {
          setAuthErro('Não consegui copiar os dados locais para a nuvem. Confira as tabelas e políticas do Supabase; os dados deste navegador continuam preservados.')
          setDadosCarregados(true)
          return
        }
      }

      if (!ativo) return
      setCloudReady(true)
      setDadosCarregados(true)
    }

    carregar().catch(() => {
      if (!ativo) return
      aplicarDados(lerLocal())
      setAuthErro('Falha ao carregar os dados da nuvem. Os dados locais foram mantidos; confira a conexão do Supabase.')
      setDadosCarregados(true)
    })

    return () => { ativo = false }
  }, [usuario, authPronto])

  useEffect(() => {
    if (!dadosCarregados) return
    try {
      localStorage.setItem('obrafacil_produtos', JSON.stringify(produtos))
      localStorage.setItem('obrafacil_clientes', JSON.stringify(clientes))
      localStorage.setItem('obrafacil_orcamentos', JSON.stringify(orcamentos))
      localStorage.setItem('obrafacil_obras', JSON.stringify(obras))
      localStorage.setItem('obrafacil_empresa', JSON.stringify(empresa))
    } catch (e) {
      console.error('Não foi possível salvar os dados locais', e)
    }
  }, [produtos, clientes, orcamentos, obras, empresa, dadosCarregados])

  useEffect(() => {
    if (!supabaseConfigured || !usuario || !cloudReady || !dadosCarregados) return
    const temporizador = setTimeout(async () => {
      const payload = { produtos, clientes, orcamentos, obras, empresa }
      const { error } = await supabase.from('obrafacil_dados').upsert({
        user_id: usuario.id,
        payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if (error) {
        setAuthErro('A gravação na nuvem falhou. Seus dados continuam salvos neste navegador; verifique a conexão e as políticas do Supabase.')
      } else {
        setAuthErro('')
      }
    }, 700)
    return () => clearTimeout(temporizador)
  }, [produtos, clientes, orcamentos, obras, empresa, usuario, cloudReady, dadosCarregados])

  const entrarOuCadastrar = async (evento) => {
    evento.preventDefault()
    setAuthErro('')
    setAuthMensagem('')
    if (!email.trim() || !senha) {
      setAuthErro('Informe seu e-mail e sua senha.')
      return
    }
    if (senha.length < 6) {
      setAuthErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    try {
      const resultado = modoAuth === 'login'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
        : await supabase.auth.signUp({ email: email.trim(), password: senha })

      if (resultado.error) {
        setAuthErro(resultado.error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos. Confira os dados ou crie sua conta.'
          : resultado.error.message)
        return
      }

      if (modoAuth === 'cadastro' && !resultado.data.session) {
        setAuthMensagem('Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre no aplicativo.')
      } else {
        setAuthMensagem('Acesso confirmado. Carregando seus dados...')
      }
    } catch {
      setAuthErro('Não foi possível conectar ao Supabase. Verifique a internet e tente novamente.')
    }
  }

  const sairDaConta = async () => {
    if (!supabaseConfigured) return
    const { error } = await supabase.auth.signOut()
    if (error) setAuthErro('Não foi possível sair da conta. Tente novamente.')
  }

  const mostrarNotificacao = (msg) => { setNotificacao(msg); setTimeout(()=>setNotificacao(null), 3000) }
  const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const bg = temaEscuro ? '#0b1220' : '#f6f7fb'
  const cardBg = temaEscuro ? '#151f32' : '#ffffff'
  const border = temaEscuro ? '#1e2d4a' : '#e8ecf2'
  const text = temaEscuro ? '#e2e8f0' : '#1e293b'

  if (supabaseConfigured && (!authPronto || (usuario && !dadosCarregados))) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f7fb', color: '#172033', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}><div style={{ fontSize: 24, fontWeight: 800, color: '#F05A28' }}>ObraFácil PRO</div><p style={{ marginTop: 12 }}>Conectando sua conta e carregando os dados...</p></div>
    </div>
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'Inter', sans-serif", paddingBottom: 'calc(100px + env(safe-area-inset-bottom))', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
      {notificacao && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#0e9f6e', color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, zIndex: 9999 }}>{notificacao}</div>}
      {authErro && <div role="alert" style={{ position: 'relative', maxWidth: 620, width: 'calc(100% - 28px)', boxSizing: 'border-box', margin: '12px auto', background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', padding: '12px 42px 12px 16px', borderRadius: 12, fontSize: 13, lineHeight: 1.45, boxShadow: '0 4px 14px rgba(0,0,0,.08)' }}><span>{authErro}</span><button type="button" aria-label="Fechar aviso" onClick={() => setAuthErro('')} style={{ position: 'absolute', right: 8, top: 6, border: 0, background: 'transparent', color: '#9a3412', fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 4 }}>×</button></div>}
            <style>{`
        html { overflow-x: hidden; max-width: 100vw; }
        body { overflow-x: hidden; max-width: 100vw; }
        /* Esconder selo powered by netlify */
        a[href*="netlify"] div, div[style*="netlify"], div[class*="netlify-badge"] { display: none !important; }
        @media (max-width: 768px) { main { padding: 16px 12px 28px !important; } header { padding: 0 12px !important; } }
      `}</style>

      <header style={{ height: 64, background: cardBg, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: '#101827', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 5px 14px rgba(234,88,12,.25)' }}><img src="./obrafacil-logo.svg" alt="ObraFácil PRO" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <div><div style={{ fontWeight: 800, letterSpacing: '-.5px', fontFamily: "'Sora', sans-serif" }}><span style={{ color: '#F05A28' }}>OBRA</span>FÁCIL <span style={{ color: '#64748b', fontSize: 11 }}>PRO</span></div><div style={{ fontSize: 10, opacity: 0.62, marginTop: 3 }}>GESTÃO DE OBRAS · {produtos.length} PRODUTOS{supabaseConfigured ? (usuario && cloudReady ? ' · NUVEM' : ' · CONTA') : ' · MODO LOCAL'}</div></div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button aria-label={temaEscuro ? 'Ativar tema claro' : 'Ativar tema escuro'} title={temaEscuro ? 'Tema claro' : 'Tema escuro'} onClick={() => setTemaEscuro(!temaEscuro)} style={{ border: `1px solid ${border}`, width: 42, height: 42, borderRadius: 12, background: temaEscuro ? '#1e293b' : '#f8fafc', color: text, cursor: 'pointer', fontSize: 19 }}>{<Icon name={temaEscuro ? 'sun' : 'moon'} size={19} />}</button>
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 32px' }}>
        {pagina === 'painel' && <Painel {...{ produtos, clientes, orcamentos, obras, setPagina, formatarMoeda, temaEscuro, cardBg, border, licenciado } } />}
        {pagina === 'orcamentos' && <Orcamentos {...{ orcamentos, setOrcamentos, produtos, clientes, empresa, mostrarNotificacao, formatarMoeda, temaEscuro, cardBg, border, licenciado } } />}
        {pagina === 'produtos' && <Produtos {...{ produtos, setProdutos, mostrarNotificacao, formatarMoeda, temaEscuro, cardBg, border } } />}
        {pagina === 'clientes' && <Clientes {...{ clientes, setClientes, orcamentos, mostrarNotificacao, temaEscuro, cardBg, border } } />}
        {pagina === 'obras' && <Obras {...{ obras, setObras, clientes, orcamentos, mostrarNotificacao, formatarMoeda, temaEscuro, cardBg, border } } />}
        {pagina === 'assistente' && <AssistenteInteligente {...{ produtos, clientes, orcamentos, obras, temaEscuro, setPagina } } />}
        {pagina === 'ofertas' && <OfertasAfiliadas {...{ temaEscuro, cardBg, border, mostrarNotificacao } } />}
        {pagina === 'configuracoes' && <Configuracoes {...{ empresa, setEmpresa, temaEscuro, mostrarNotificacao, cardBg, border, produtos, supabaseConfigured, usuario, email, setEmail, senha, setSenha, modoAuth, setModoAuth, authErro, setAuthErro, authMensagem, entrarOuCadastrar, sairDaConta } } />}
      </main>
            <nav style={{ position: 'fixed', bottom: 'calc(12px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', maxWidth: 'calc(100vw - 16px)', background: cardBg, border: `1px solid ${border}`, borderRadius: 16, display: 'flex', padding: 6, gap: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 999, overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
        <style>{` nav::-webkit-scrollbar { display: none; } @media (max-width: 400px) { nav button { padding: 10px 12px !important; font-size: 12px !important; } } `}</style>
        {[
          { id: 'painel', label: 'Painel', icon: 'dashboard' },
          { id: 'orcamentos', label: 'Orçamentos', icon: 'receipt', badge: orcamentos.length },
          { id: 'produtos', label: 'Produtos', icon: 'package', badge: produtos.length },
          { id: 'clientes', label: 'Clientes', icon: 'users', badge: clientes.length },
          { id: 'obras', label: 'Obras', icon: 'building', badge: obras.length },
          { id: 'assistente', label: 'IA ObraFácil', icon: 'settings' },
          { id: 'ofertas', label: 'Ofertas', icon: 'package' },
          { id: 'configuracoes', label: 'Configurações', icon: 'settings' },
        ].map(item => {
          const ativo = pagina === item.id
          return <button key={item.id} onClick={() => setPagina(item.id)} style={{ border: 'none', background: ativo ? '#F05A28' : 'transparent', color: ativo ? '#fff' : text, padding: '11px 14px', borderRadius: 11, cursor: 'pointer', fontWeight: ativo ? 700 : 600, fontSize: 12, flex: '0 0 auto', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 7, transition: 'all .18s' }}><Icon name={item.icon} size={16} strokeWidth={2.2} /><span>{item.label}</span>{item.badge>0?<span style={{ fontSize: 10, opacity: .8, background: ativo ? 'rgba(255,255,255,.2)' : (temaEscuro ? '#263449' : '#eef2f7'), padding: '2px 6px', borderRadius: 20 }}>{item.badge}</span>:null}</button>
        })}
      </nav>
    </div>
  )
}
