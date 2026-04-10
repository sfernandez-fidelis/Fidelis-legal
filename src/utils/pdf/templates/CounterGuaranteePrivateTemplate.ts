import { CounterGuaranteeData, PartyDetails } from '../../../types';
import {
  formatDPI,
  formatDateInWords,
  formatNumberWithWords,
  formatPolicyType,
  getPartyIdentityNumber,
  numberToWords,
} from '../formatters';

const getPartyLegalString = (party: PartyDetails) => {
  const identityNumber = getPartyIdentityNumber(party);
  const base = `${party.name}, de ${party.age} años de edad, ${party.maritalStatus}, ${party.profession}, guatemalteco, de este domicilio, identificándome con el Documento Personal de Identificación -DPI- con Código Único de Identificación -CUI- ${formatDPI(identityNumber)} extendido por el Registro Nacional las Personas de la República de Guatemala`;

  if (party.isRepresenting) {
    return `${base}, actuando en calidad de ${party.role}, de la entidad denominada ${party.entityName}, lo cual acredito con el Acta Notarial de mi nombramiento autorizada en la ciudad de Guatemala por el Notario ${party.notaryName}, el ${formatDateInWords(party.actDate, { includeYearLabel: true })}, inscrita en el Registro Mercantil General de la República al número de registro ${formatNumberWithWords(party.regNumber || '')}, folio ${formatNumberWithWords(party.regFolio || '')}, del libro ${formatNumberWithWords(party.regBook || '')} de Auxiliares de Comercio`;
  }

  return base;
};

export const generateCounterGuaranteePrivateHTML = (data: CounterGuaranteeData) => {
  const principalStr = `a) ${getPartyLegalString(data.principal)}`;
  const guarantorsStr = data.guarantors
    .map((guarantor, index) => `${String.fromCharCode(98 + index)}) ${getPartyLegalString(guarantor)}`)
    .join(' y, ');

  const policiesStr = data.policies
    .map((policy, index) => {
      const policyTypeFormatted = formatPolicyType(policy.type);
      const policyNumWords = formatNumberWithWords(policy.number);
      const amountWords = numberToWords(policy.amount);
      const exactosStr = policy.amount % 1 === 0 ? ' exactos' : '';

      return `Clase ${policyTypeFormatted}, con número de póliza ${policyNumWords}, por un monto afianzado de hasta ${amountWords} Quetzales${exactosStr} (Q.${policy.amount.toLocaleString('es-GT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })})${index === data.policies.length - 1 ? '. ' : ' y, '}`;
    })
    .join('');

  const dateStr = formatDateInWords(data.contractDate);
  const allParties = [data.principal, ...data.guarantors];
  const entityNames = allParties
    .filter((party) => party.isRepresenting)
    .map((party) => `"${party.entityName?.toUpperCase()}"`)
    .join(' y ');

  return `
    <div style="font-family: 'Times New Roman', serif; line-height: 1.6; text-align: justify; font-size: 11pt; padding: 40px; color: #000;">
      <p style="margin-bottom: 0;">
        En la Ciudad de Guatemala, departamento de Guatemala, el día ${dateStr}. Comparecemos por una parte: BRASIL HAROLDO ARENAS MORALES, de sesenta y tres años de edad, casado, guatemalteco, Ejecutivo, con domicilio en el departamento de Guatemala, identificándome con el Documento Personal de Identificación -DPI- con código único de identificación -CUI- dos mil seiscientos cuarenta y seis, quince mil doscientos sesenta y tres, cero ciento uno (2646 15263 0101), extendido por el Registro Nacional de las Personas, de la República de Guatemala, actuando en mi calidad de GERENTE GENERAL Y REPRESENTANTE LEGAL, de la entidad denominada "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", lo cual acredito con el Acta Notarial de mi nombramiento autorizada en la ciudad de Guatemala por el Notario Juan Carlos Díaz Monroy, el veintidós de abril del año dos mil diecinueve, inscrita en el Registro Mercantil General de la República al número quinientos sesenta mil trescientos setenta y seis (560376), folio trescientos setenta y siete (377) del libro setecientos once (711) de Auxiliares de Comercio. La entidad "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada en lo sucesivo "LA AFIANZADORA", y por la otra parte comparece: ${principalStr}${data.guarantors.length > 0 ? ` y, ${guarantorsStr}` : ''}.
        Las entidades ${entityNames || 'comparecientes'}, podrán ser llamadas en el transcurso del presente documento como "LA PARTE OBLIGADA"; HACEMOS CONSTAR: a) de que los comparecientes aseguramos ser de las generales indicadas y encontrarnos en el libre ejercicio de nuestros derechos civiles; b) que tenemos a la vista la documentación fehaciente y que toda representación que se ejercita es suficiente conforme a la ley y a nuestro juicio para el presente acto; c) Los comparecientes manifestamos que otorgamos un contrato de CONTRAFIANZA, CON GARANTÍA FIDUCIARIA EN DOCUMENTO PRIVADO CON FIRMAS LEGALIZADAS, contenida en las siguientes cláusulas:
        PRIMERA: Declara LA PARTE OBLIGADA, que LA AFIANZADORA, emitió las pólizas de fianza: ${policiesStr} cuya responsabilidad es imputable a ${(data.principal.entityName || data.principal.name).toUpperCase()} ante el ${data.beneficiaryName.toUpperCase()}, entidad que es beneficiaria de las citadas pólizas de fianza.
        SEGUNDA: Manifiesta además LA PARTE OBLIGADA, que por este acto se compromete expresamente a pagar en forma mancomunada y solidaria a LA AFIANZADORA, sobre cualquier cantidad de dinero, gastos de reclamación, gastos de ajustes, impuestos u otros gastos, así como el interés legal y costas si fuere el caso que por razón o con cargo a las fianzas emitidas y descritas en el presente documento, LA ENTIDAD BENEFICIARIA, requiera de pago a LA AFIANZADORA. Dichos pagos deberá efectuarlos LA PARTE OBLIGADA, sin requerimiento alguno, inmediatamente a la fecha en que LA AFIANZADORA sea notificada o requerida de pago por LA ENTIDAD BENEFICIARIA. LA PARTE OBLIGADA también se compromete al pago inmediato de las primas de estas fianzas, sus endosos, anexos, ampliaciones, aumentos, modificaciones y/o prórrogas. Sobre cualquier cantidad que LA AFIANZADORA le notifique como Nota de débito a su cargo LA AFIANZADORA queda facultada a cobrar los intereses legales; intereses que empezarán a correr desde la fecha de la obligación y hasta su total cancelación. La obligación que en este documento asume LA PARTE OBLIGADA es por la suma consignada en las fianzas descritas en la cláusula primera del presente documento. El plazo de esta obligación es por el tiempo que mantengan su vigencia la fianza anteriormente descrita o sus endosos, prórrogas y/o renovaciones, y la vigencia de la presente contragarantía estará sujeta a la condición suspensiva de que la entidad beneficiaria de las fianzas emitidas, libere de sus obligaciones a ${(data.principal.entityName || data.principal.name).toUpperCase()} y/o hasta que LA AFIANZADORA haya recuperado la totalidad de la suma que en virtud de las fianzas mencionadas hubiere pagado, así como los intereses, gastos de reclamación, gastos de ajuste, impuestos, costas procesales u otros gastos si fuere el caso.
        TERCERA: LA PARTE OBLIGADA acepta expresamente que: A) Todo pago lo hará en las Oficinas Centrales de LA AFIANZADORA, en la ciudad de Guatemala, sin necesidad de cobro ni requerimiento alguno, en efectivo y en moneda de curso legal; B) Que es título ejecutivo indiscutible el presente documento privado; C) Como buenas y exactas las cuentas que LA AFIANZADORA lleve con respecto a este negocio y como líquido, exigible, de plazo vencido y ejecutivo el saldo que se le reclame; D) Renuncia al fuero de su domicilio y se somete expresamente a los Tribunales que elija LA AFIANZADORA; E) Faculta a LA AFIANZADORA para que en caso de cobro judicial, embargue bienes de su propiedad sin atender ningún orden legal preestablecido, en virtud de la mancomunidad solidaria aquí pactada; F) Los gastos de este documento, los gastos de cobranza judicial o extrajudicial son a cargo de LA PARTE OBLIGADA; G) En caso de ejecución, juntamente con el importe de la reclamación más intereses y costas, se cobrará a LA PARTE OBLIGADA el valor del presente documento y lo relativo al pago de los impuestos respectivos, si a tal fecha no hubiere pagado el mismo, lo cual podrá acreditar en vía de excepción; H) Que las garantías aquí constituidas, estarán vigentes por el plazo establecido, por el tiempo de vigencia de las fianzas, y sus modificaciones, endosos, renovaciones o prórrogas que se tengan que realizar en el futuro, y hasta que LA AFIANZADORA recupere la suma pagada a LA ENTIDAD BENEFICIARIA; I) LA PARTE OBLIGADA autoriza a LA AFIANZADORA, a efectuar pago en caso de reclamación a primer requerimiento de ejecución de las fianzas descritas en la primera cláusula del presente documento, sin necesidad de existir investigación previa, teniendo como buenas y exactas las cuentas que LA AFIANZADORA presente, comprometiéndose a reintegrar, a primer requerimiento, el monto cancelado por parte de LA AFIANZADORA; J) LA PARTE OBLIGADA señala como lugar para recibir notificaciones en la ${data.notificationAddress}, siendo válidas las que en dicho lugar se le haga y renuncia a pedir nulidad por la primera notificación que en esa dirección se le haga, salvo que por escrito y con aviso Notarial de recepción notifique a LA AFIANZADORA el cambio de la misma, con quince días hábiles de anticipación.
        CUARTA: Los comparecientes con las calidades con que actúan declaran que en los términos relacionados aceptan el presente contrato y el señor BRASIL HAROLDO ARENAS MORALES, en la calidad con que actúa, a nombre de su representada acepta la garantía constituida a favor de ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA. Los comparecientes HACEMOS CONSTAR: a) todo lo expuesto, b) de haber tenido a la vista la documentación antes relacionada y c) que damos íntegra lectura a lo escrito, y enterados de su contenido, objeto, validez y demás efectos legales, lo aceptamos, ratificamos y firmamos.
      </p>

      <div style="margin-top: 60px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
            <p style="font-size: 9pt; margin: 0;">BRASIL HAROLDO ARENAS MORALES</p>
          </div>
          ${data.signatureNames
            .map(
              (name) => `
            <div style="text-align: center;">
              <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
              <p style="font-size: 9pt; margin: 0;">${name.toUpperCase()}</p>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>

      <div style="margin-top: 60px; border-top: 1px solid #000; padding-top: 20px;">
        <p style="margin-bottom: 0;">
          AUTÉNTICA: En la Ciudad de Guatemala, departamento de Guatemala, el día ${dateStr}, como Notario, DOY FE: que las firmas que anteceden son auténticas, por haber sido signadas el día de hoy en mi presencia por los señores: a) BRASIL HAROLDO ARENAS MORALES, quien se identifica con el Documento Personal de Identificación -DPI- con código único de identificación -CUI- dos mil seiscientos cuarenta y seis, quince mil doscientos sesenta y tres, cero ciento uno (2646 15263 0101), extendido por el Registro Nacional de las Personas de la república de Guatemala, quien actúa en su calidad de GERENTE GENERAL Y REPRESENTANTE LEGAL, de la entidad denominada "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", lo cual acredita con el Acta Notarial de mi nombramiento autorizada en la ciudad de Guatemala por el Notario Juan Carlos Díaz Monroy, el veintidós de abril del año dos mil diecinueve, inscrita en el Registro Mercantil General de la República al número quinientos sesenta mil trescientos setenta y seis (560376), folio trescientos setenta y siete (377) del libro setecientos once (711) de Auxiliares de Comercio,
          ${allParties
            .map((party, index) => {
              const identityNumber = getPartyIdentityNumber(party);
              const label = String.fromCharCode(98 + index);
              let text = `${label}) ${party.name.toUpperCase()}, quien se identifica con el Documento Personal de Identificación -DPI- con Código Único de Identificación -CUI- ${formatDPI(identityNumber)} extendido por el Registro Nacional de las Personas de la República de Guatemala`;

              if (party.isRepresenting) {
                text += `, actuando en calidad de ${party.role?.toUpperCase()}, de la entidad denominada ${party.entityName?.toUpperCase()}, lo cual acredita con el Acta Notarial de mi nombramiento autorizada en la ciudad de Guatemala por el Notario ${party.notaryName}, el ${formatDateInWords(party.actDate, { includeYearLabel: true })}, inscrita en el Registro Mercantil General de la República al número de registro ${formatNumberWithWords(party.regNumber || '')}, folio ${formatNumberWithWords(party.regFolio || '')}, del libro ${formatNumberWithWords(party.regBook || '')} de Auxiliares de Comercio`;
              }

              return text;
            })
            .join(', ')}.
          Las firmas se encuentran puestas en un documento privado de CONTRAFIANZA CON GARANTÍA FIDUCIARIA EN DOCUMENTO PRIVADO CON FIRMAS LEGALIZADAS; y los anteriormente mencionados vuelven a firmar al pie de la presente Acta de Legalización.
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
            <p style="font-size: 9pt; margin: 0;">BRASIL HAROLDO ARENAS MORALES</p>
          </div>
          ${data.signatureNames
            .map(
              (name) => `
            <div style="text-align: center;">
              <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
              <p style="font-size: 9pt; margin: 0;">${name.toUpperCase()}</p>
            </div>
          `,
            )
            .join('')}
        </div>

        <p style="margin-top: 40px; font-weight: bold;">ANTE MÍ:</p>
      </div>
    </div>
  `;
};
