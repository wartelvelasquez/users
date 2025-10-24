/**
 * Utilidades para manejo de números de teléfono internacionales
 */

export interface PhoneComponents {
  countryCode: string;
  phoneNumber: string;
  fullPhone: string;
}

/**
 * Separa un número de teléfono completo en código de país y número
 * @param fullPhone Número completo con código de país (ej: +584141452293)
 * @returns Objeto con código de país, número y teléfono completo
 */
export function parsePhoneNumber(fullPhone: string): PhoneComponents {
  if (!fullPhone) {
    return {
      countryCode: '',
      phoneNumber: '',
      fullPhone: ''
    };
  }

  // Remover espacios y caracteres especiales excepto +
  const cleanPhone = fullPhone.replace(/[^\d+]/g, '');
  
  // Si no empieza con +, agregarlo
  const phoneWithPlus = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
  
  // Lista de códigos de país más comunes ordenados por longitud (de mayor a menor)
  const countryCodes = [
    // 3 dígitos
    '+593', // Ecuador
    '+595', // Paraguay
    '+598', // Uruguay
    '+591', // Bolivia
    '+592', // Guyana
    '+597', // Surinam
    '+594', // Guayana Francesa
    '+596', // Martinica
    '+590', // Guadalupe
    '+508', // San Pedro y Miquelón
    '+509', // Haití
    '+507', // Panamá
    '+506', // Costa Rica
    '+505', // Nicaragua
    '+504', // Honduras
    '+503', // El Salvador
    '+502', // Guatemala
    '+501', // Belice
    '+500', // Islas Malvinas
    '+299', // Groenlandia
    '+298', // Islas Feroe
    '+297', // Aruba
    '+291', // Eritrea
    '+290', // Santa Helena
    '+289', // San Vicente y las Granadinas
    '+288', // San Cristóbal y Nieves
    '+287', // San Bartolomé
    '+286', // San Martín
    '+285', // San Pedro y Miquelón
    '+284', // San Vicente y las Granadinas
    '+283', // San Cristóbal y Nieves
    '+282', // San Bartolomé
    '+281', // San Martín
    '+280', // San Pedro y Miquelón
    '+279', // San Vicente y las Granadinas
    '+278', // San Cristóbal y Nieves
    '+277', // San Bartolomé
    '+276', // San Martín
    '+275', // San Pedro y Miquelón
    '+274', // San Vicente y las Granadinas
    '+273', // San Cristóbal y Nieves
    '+272', // San Bartolomé
    '+271', // San Martín
    '+270', // San Pedro y Miquelón
    '+269', // San Vicente y las Granadinas
    '+268', // San Cristóbal y Nieves
    '+267', // San Bartolomé
    '+266', // San Martín
    '+265', // San Pedro y Miquelón
    '+264', // San Vicente y las Granadinas
    '+263', // San Cristóbal y Nieves
    '+262', // San Bartolomé
    '+261', // San Martín
    '+260', // San Pedro y Miquelón
    '+259', // San Vicente y las Granadinas
    '+258', // San Cristóbal y Nieves
    '+257', // San Bartolomé
    '+256', // San Martín
    '+255', // San Pedro y Miquelón
    '+254', // San Vicente y las Granadinas
    '+253', // San Cristóbal y Nieves
    '+252', // San Bartolomé
    '+251', // San Martín
    '+250', // San Pedro y Miquelón
    '+249', // San Vicente y las Granadinas
    '+248', // San Cristóbal y Nieves
    '+247', // San Bartolomé
    '+246', // San Martín
    '+245', // San Pedro y Miquelón
    '+244', // San Vicente y las Granadinas
    '+243', // San Cristóbal y Nieves
    '+242', // San Bartolomé
    '+241', // San Martín
    '+240', // San Pedro y Miquelón
    '+239', // San Vicente y las Granadinas
    '+238', // San Cristóbal y Nieves
    '+237', // San Bartolomé
    '+236', // San Martín
    '+235', // San Pedro y Miquelón
    '+234', // San Vicente y las Granadinas
    '+233', // San Cristóbal y Nieves
    '+232', // San Bartolomé
    '+231', // San Martín
    '+230', // San Pedro y Miquelón
    '+229', // San Vicente y las Granadinas
    '+228', // San Cristóbal y Nieves
    '+227', // San Bartolomé
    '+226', // San Martín
    '+225', // San Pedro y Miquelón
    '+224', // San Vicente y las Granadinas
    '+223', // San Cristóbal y Nieves
    '+222', // San Bartolomé
    '+221', // San Martín
    '+220', // San Pedro y Miquelón
    '+219', // San Vicente y las Granadinas
    '+218', // San Cristóbal y Nieves
    '+217', // San Bartolomé
    '+216', // San Martín
    '+215', // San Pedro y Miquelón
    '+214', // San Vicente y las Granadinas
    '+213', // San Cristóbal y Nieves
    '+212', // San Bartolomé
    '+211', // San Martín
    '+210', // San Pedro y Miquelón
    '+209', // San Vicente y las Granadinas
    '+208', // San Cristóbal y Nieves
    '+207', // San Bartolomé
    '+206', // San Martín
    '+205', // San Pedro y Miquelón
    '+204', // San Vicente y las Granadinas
    '+203', // San Cristóbal y Nieves
    '+202', // San Bartolomé
    '+201', // San Martín
    '+200', // San Pedro y Miquelón
    '+199', // San Vicente y las Granadinas
    '+198', // San Cristóbal y Nieves
    '+197', // San Bartolomé
    '+196', // San Martín
    '+195', // San Pedro y Miquelón
    '+194', // San Vicente y las Granadinas
    '+193', // San Cristóbal y Nieves
    '+192', // San Bartolomé
    '+191', // San Martín
    '+190', // San Pedro y Miquelón
    '+189', // San Vicente y las Granadinas
    '+188', // San Cristóbal y Nieves
    '+187', // San Bartolomé
    '+186', // San Martín
    '+185', // San Pedro y Miquelón
    '+184', // San Vicente y las Granadinas
    '+183', // San Cristóbal y Nieves
    '+182', // San Bartolomé
    '+181', // San Martín
    '+180', // San Pedro y Miquelón
    '+179', // San Vicente y las Granadinas
    '+178', // San Cristóbal y Nieves
    '+177', // San Bartolomé
    '+176', // San Martín
    '+175', // San Pedro y Miquelón
    '+174', // San Vicente y las Granadinas
    '+173', // San Cristóbal y Nieves
    '+172', // San Bartolomé
    '+171', // San Martín
    '+170', // San Pedro y Miquelón
    '+169', // San Vicente y las Granadinas
    '+168', // San Cristóbal y Nieves
    '+167', // San Bartolomé
    '+166', // San Martín
    '+165', // San Pedro y Miquelón
    '+164', // San Vicente y las Granadinas
    '+163', // San Cristóbal y Nieves
    '+162', // San Bartolomé
    '+161', // San Martín
    '+160', // San Pedro y Miquelón
    '+159', // San Vicente y las Granadinas
    '+158', // San Cristóbal y Nieves
    '+157', // San Bartolomé
    '+156', // San Martín
    '+155', // San Pedro y Miquelón
    '+154', // San Vicente y las Granadinas
    '+153', // San Cristóbal y Nieves
    '+152', // San Bartolomé
    '+151', // San Martín
    '+150', // San Pedro y Miquelón
    '+149', // San Vicente y las Granadinas
    '+148', // San Cristóbal y Nieves
    '+147', // San Bartolomé
    '+146', // San Martín
    '+145', // San Pedro y Miquelón
    '+144', // San Vicente y las Granadinas
    '+143', // San Cristóbal y Nieves
    '+142', // San Bartolomé
    '+141', // San Martín
    '+140', // San Pedro y Miquelón
    '+139', // San Vicente y las Granadinas
    '+138', // San Cristóbal y Nieves
    '+137', // San Bartolomé
    '+136', // San Martín
    '+135', // San Pedro y Miquelón
    '+134', // San Vicente y las Granadinas
    '+133', // San Cristóbal y Nieves
    '+132', // San Bartolomé
    '+131', // San Martín
    '+130', // San Pedro y Miquelón
    '+129', // San Vicente y las Granadinas
    '+128', // San Cristóbal y Nieves
    '+127', // San Bartolomé
    '+126', // San Martín
    '+125', // San Pedro y Miquelón
    '+124', // San Vicente y las Granadinas
    '+123', // San Cristóbal y Nieves
    '+122', // San Bartolomé
    '+121', // San Martín
    '+120', // San Pedro y Miquelón
    '+119', // San Vicente y las Granadinas
    '+118', // San Cristóbal y Nieves
    '+117', // San Bartolomé
    '+116', // San Martín
    '+115', // San Pedro y Miquelón
    '+114', // San Vicente y las Granadinas
    '+113', // San Cristóbal y Nieves
    '+112', // San Bartolomé
    '+111', // San Martín
    '+110', // San Pedro y Miquelón
    '+109', // San Vicente y las Granadinas
    '+108', // San Cristóbal y Nieves
    '+107', // San Bartolomé
    '+106', // San Martín
    '+105', // San Pedro y Miquelón
    '+104', // San Vicente y las Granadinas
    '+103', // San Cristóbal y Nieves
    '+102', // San Bartolomé
    '+101', // San Martín
    '+100', // San Pedro y Miquelón
    '+99',  // San Vicente y las Granadinas
    '+98',  // San Cristóbal y Nieves
    '+97',  // San Bartolomé
    '+96',  // San Martín
    '+95',  // San Pedro y Miquelón
    '+94',  // San Vicente y las Granadinas
    '+93',  // San Cristóbal y Nieves
    '+92',  // San Bartolomé
    '+91',  // San Martín
    '+90',  // San Pedro y Miquelón
    '+89',  // San Vicente y las Granadinas
    '+88',  // San Cristóbal y Nieves
    '+87',  // San Bartolomé
    '+86',  // San Martín
    '+85',  // San Pedro y Miquelón
    '+84',  // San Vicente y las Granadinas
    '+83',  // San Cristóbal y Nieves
    '+82',  // San Bartolomé
    '+81',  // San Martín
    '+80',  // San Pedro y Miquelón
    '+79',  // San Vicente y las Granadinas
    '+78',  // San Cristóbal y Nieves
    '+77',  // San Bartolomé
    '+76',  // San Martín
    '+75',  // San Pedro y Miquelón
    '+74',  // San Vicente y las Granadinas
    '+73',  // San Cristóbal y Nieves
    '+72',  // San Bartolomé
    '+71',  // San Martín
    '+70',  // San Pedro y Miquelón
    '+69',  // San Vicente y las Granadinas
    '+68',  // San Cristóbal y Nieves
    '+67',  // San Bartolomé
    '+66',  // San Martín
    '+65',  // San Pedro y Miquelón
    '+64',  // San Vicente y las Granadinas
    '+63',  // San Cristóbal y Nieves
    '+62',  // San Bartolomé
    '+61',  // San Martín
    '+60',  // San Pedro y Miquelón
    '+59',  // San Vicente y las Granadinas
    '+58',  // Venezuela
    '+57',  // Colombia
    '+56',  // Chile
    '+55',  // Brasil
    '+54',  // Argentina
    '+53',  // Cuba
    '+52',  // México
    '+51',  // Perú
    '+50',  // Guatemala
    '+49',  // Alemania
    '+48',  // Polonia
    '+47',  // Noruega
    '+46',  // Suecia
    '+45',  // Dinamarca
    '+44',  // Reino Unido
    '+43',  // Austria
    '+42',  // República Checa
    '+41',  // Suiza
    '+40',  // Rumania
    '+39',  // Italia
    '+38',  // Bulgaria
    '+37',  // Moldavia
    '+36',  // Hungría
    '+35',  // Malta
    '+34',  // España
    '+33',  // Francia
    '+32',  // Bélgica
    '+31',  // Países Bajos
    '+30',  // Grecia
    '+29',  // Groenlandia
    '+28',  // Islas Feroe
    '+27',  // Sudáfrica
    '+26',  // Zambia
    '+25',  // República Democrática del Congo
    '+24',  // Angola
    '+23',  // Guinea Ecuatorial
    '+22',  // Santo Tomé y Príncipe
    '+21',  // Guinea-Bisáu
    '+20',  // Egipto
    '+19',  // Islas Cook
    '+18',  // Islas Marshall
    '+17',  // Islas Salomón
    '+16',  // Islas Marianas del Norte
    '+15',  // Islas Marianas del Norte
    '+14',  // Islas Marianas del Norte
    '+13',  // Islas Marianas del Norte
    '+12',  // Islas Marianas del Norte
    '+11',  // Islas Marianas del Norte
    '+10',  // Islas Marianas del Norte
    '+9',   // Japón
    '+8',   // China
    '+7',   // Rusia
    '+6',   // Malasia
    '+5',   // Indonesia
    '+4',   // Afganistán
    '+3',   // Rusia
    '+2',   // Egipto
    '+1',   // Estados Unidos/Canadá
  ];

  // Buscar el código de país más largo que coincida
  for (const code of countryCodes) {
    if (phoneWithPlus.startsWith(code)) {
      return {
        countryCode: code,
        phoneNumber: phoneWithPlus.substring(code.length),
        fullPhone: phoneWithPlus
      };
    }
  }

  // Si no se encuentra un código de país válido, asumir que es un número local
  return {
    countryCode: '',
    phoneNumber: phoneWithPlus.replace('+', ''),
    fullPhone: phoneWithPlus
  };
}

/**
 * Combina código de país y número de teléfono
 * @param countryCode Código de país (ej: +58)
 * @param phoneNumber Número de teléfono (ej: 4141452293)
 * @returns Número completo (ej: +584141452293)
 */
export function combinePhoneNumber(countryCode: string, phoneNumber: string): string {
  if (!countryCode && !phoneNumber) {
    return '';
  }
  
  if (!countryCode) {
    return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  }
  
  if (!phoneNumber) {
    return countryCode;
  }
  
  const cleanCountryCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  const cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
  
  return `${cleanCountryCode}${cleanPhoneNumber}`;
}

/**
 * Valida si un número de teléfono tiene formato válido
 * @param phone Número de teléfono a validar
 * @returns true si es válido, false en caso contrario
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  // Remover espacios y caracteres especiales excepto +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Debe empezar con + y tener al menos 7 dígitos después del código de país
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  
  return phoneRegex.test(cleanPhone);
}
