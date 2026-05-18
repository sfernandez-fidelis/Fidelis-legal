import { ContractType } from '../../../types';

/* ── Fidelis representative boilerplate (always fixed) ── */
const FIDELIS_REP = `BRASIL HAROLDO ARENAS MORALES, de sesenta y tres años de edad, casado, guatemalteco, Ejecutivo, con domicilio en el departamento de Guatemala, identificándome con el Documento Personal de Identificación -DPI- con código único de identificación -CUI- dos mil seiscientos cuarenta y seis, quince mil doscientos sesenta y tres, cero ciento uno (2646 15263 0101), extendido por el Registro Nacional de las Personas, de la República de Guatemala, actuando en mi calidad de GERENTE GENERAL Y REPRESENTANTE LEGAL, de la entidad denominada "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", lo cual acredito con el Acta Notarial de mi nombramiento autorizada en la ciudad de Guatemala por el Notario Juan Carlos Díaz Monroy, el veintidós de abril del año dos mil diecinueve, inscrita en el Registro Mercantil General de la República al número quinientos sesenta mil trescientos setenta y seis (560376), folio trescientos setenta y siete (377) del libro setecientos once (711) de Auxiliares de Comercio`;

const FIDELIS_REP_PUBLIC = `el señor BRASIL HAROLDO ARENAS MORALES, de sesenta y tres años de edad, casado, guatemalteco, Ejecutivo, de este domicilio, quien se identifica con el Documento Personal de Identificación -DPI- con código único de identificación -CUI- dos mil seiscientos cuarenta y seis, quince mil doscientos sesenta y tres, cero ciento uno (2646 15263 0101), extendido por el Registro Nacional de las Personas, de la República de Guatemala, quien actúa en su calidad de GERENTE GENERAL Y REPRESENTANTE LEGAL, de la entidad denominada "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", lo cual acredita con el Acta Notarial de su nombramiento autorizada en esta ciudad por el Notario Juan Carlos Díaz Monroy, el veintidós de abril del año dos mil diecinueve, inscrita en el Registro Mercantil General de la República al número quinientos sesenta mil trescientos setenta y seis (560376), folio trescientos setenta y siete (377) del libro setecientos once (711) de Auxiliares de Comercio`;

/* ── 1. CG Privada Individual ── */
const CG_PRIVATE_INDIVIDUAL = `
<p>En la Ciudad de Guatemala, departamento de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. Comparecemos por una parte: ${FIDELIS_REP}. La entidad "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada en lo sucesivo "LA AFIANZADORA", y por la otra parte comparece: <mark>{{DATOS_FIADO}}</mark>; y <mark>{{DATOS_FIADORES}}</mark>.</p>
<p>Las entidades comparecientes, podrán ser llamadas en el transcurso del presente documento como "LA PARTE OBLIGADA"; HACEMOS CONSTAR: a) de que los comparecientes aseguramos ser de las generales indicadas y encontrarnos en el libre ejercicio de nuestros derechos civiles; b) que tenemos a la vista la documentación fehaciente y que toda representación que se ejercita es suficiente conforme a la ley y a nuestro juicio para el presente acto; c) Los comparecientes manifestamos que otorgamos un contrato de CONTRAFIANZA, CON GARANTÍA FIDUCIARIA EN DOCUMENTO PRIVADO CON FIRMAS LEGALIZADAS, contenida en las siguientes cláusulas:</p>
<p><strong>PRIMERA:</strong> Declara LA PARTE OBLIGADA, que LA AFIANZADORA, emitió las pólizas de fianza: <mark>{{DATOS_POLIZAS}}</mark> cuya responsabilidad es imputable a <mark>{{DATOS_FIADO}}</mark> ante el <mark>{{BENEFICIARIO}}</mark>, entidad que es beneficiaria de las citadas pólizas de fianza.</p>
<p><strong>SEGUNDA:</strong> Manifiesta además LA PARTE OBLIGADA, que por este acto se compromete expresamente a pagar en forma mancomunada y solidaria a LA AFIANZADORA, sobre cualquier cantidad de dinero, gastos de reclamación, gastos de ajustes, impuestos u otros gastos, así como el interés legal y costas si fuere el caso que por razón o con cargo a las fianzas emitidas y descritas en el presente documento, LA ENTIDAD BENEFICIARIA, requiera de pago a LA AFIANZADORA. Dichos pagos deberá efectuarlos LA PARTE OBLIGADA, sin requerimiento alguno, inmediatamente a la fecha en que LA AFIANZADORA sea notificada o requerida de pago por LA ENTIDAD BENEFICIARIA.</p>
<p><strong>TERCERA:</strong> LA PARTE OBLIGADA acepta expresamente que: A) Todo pago lo hará en las Oficinas Centrales de LA AFIANZADORA, en la ciudad de Guatemala, sin necesidad de cobro ni requerimiento alguno, en efectivo y en moneda de curso legal; B) Que es título ejecutivo indiscutible el presente documento privado; C) Como buenas y exactas las cuentas que LA AFIANZADORA lleve con respecto a este negocio y como líquido, exigible, de plazo vencido y ejecutivo el saldo que se le reclame; D) Renuncia al fuero de su domicilio y se somete expresamente a los Tribunales que elija LA AFIANZADORA; E) Faculta a LA AFIANZADORA para que en caso de cobro judicial, embargue bienes de su propiedad sin atender ningún orden legal preestablecido, en virtud de la mancomunidad solidaria aquí pactada; F) Los gastos de este documento, los gastos de cobranza judicial o extrajudicial son a cargo de LA PARTE OBLIGADA; G) En caso de ejecución, juntamente con el importe de la reclamación más intereses y costas, se cobrará a LA PARTE OBLIGADA el valor del presente documento y lo relativo al pago de los impuestos respectivos; H) Que las garantías aquí constituidas, estarán vigentes por el plazo establecido, por el tiempo de vigencia de las fianzas, y sus modificaciones, endosos, renovaciones o prórrogas que se tengan que realizar en el futuro; I) LA PARTE OBLIGADA autoriza a LA AFIANZADORA, a efectuar pago en caso de reclamación a primer requerimiento de ejecución de las fianzas descritas; J) LA PARTE OBLIGADA señala como lugar para recibir notificaciones en la <mark>{{DIRECCION_NOTIFICACIONES}}</mark>.</p>
<p><strong>CUARTA:</strong> Los comparecientes con las calidades con que actúan declaran que en los términos relacionados aceptan el presente contrato y el señor BRASIL HAROLDO ARENAS MORALES, en la calidad con que actúa, a nombre de su representada acepta la garantía constituida a favor de ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA.</p>
<p><mark>{{FIRMAS}}</mark></p>
<p><mark>{{AUTENTICA}}</mark></p>
`;

/* ── 2. CG Privada Sociedad ── */
const CG_PRIVATE_ENTITY = `
<p>En la Ciudad de Guatemala, departamento de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. Comparecemos por una parte: ${FIDELIS_REP}. La entidad "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada en lo sucesivo "LA AFIANZADORA", y por la otra parte comparece: <mark>{{DATOS_FIADO}}</mark>; y <mark>{{DATOS_FIADORES}}</mark>.</p>
<p>Las entidades comparecientes, podrán ser llamadas en el transcurso del presente documento como "LA PARTE OBLIGADA"; HACEMOS CONSTAR: a) de que los comparecientes aseguramos ser de las generales indicadas y encontrarnos en el libre ejercicio de nuestros derechos civiles; b) que tenemos a la vista la documentación fehaciente y que toda representación que se ejercita es suficiente conforme a la ley y a nuestro juicio para el presente acto; c) Los comparecientes manifestamos que otorgamos un contrato de CONTRAFIANZA, CON GARANTÍA FIDUCIARIA EN DOCUMENTO PRIVADO CON FIRMAS LEGALIZADAS, contenida en las siguientes cláusulas:</p>
<p><strong>PRIMERA:</strong> Declara LA PARTE OBLIGADA, que LA AFIANZADORA, emitió las pólizas de fianza: <mark>{{DATOS_POLIZAS}}</mark> cuya responsabilidad es imputable a <mark>{{DATOS_FIADO}}</mark> ante el <mark>{{BENEFICIARIO}}</mark>.</p>
<p><strong>SEGUNDA:</strong> Manifiesta además LA PARTE OBLIGADA, que por este acto se compromete expresamente a pagar en forma mancomunada y solidaria a LA AFIANZADORA, cualquier cantidad de dinero, gastos de reclamación, gastos de ajustes, impuestos u otros gastos, así como el interés legal y costas.</p>
<p><strong>TERCERA:</strong> LA PARTE OBLIGADA acepta expresamente que: A) Todo pago lo hará en las Oficinas Centrales de LA AFIANZADORA; B) Que es título ejecutivo indiscutible el presente documento privado; C) Como buenas y exactas las cuentas que LA AFIANZADORA lleve; D) Renuncia al fuero de su domicilio; E) Faculta a LA AFIANZADORA para embargo; F) Los gastos son a cargo de LA PARTE OBLIGADA; G) Las garantías estarán vigentes por el tiempo de vigencia de las fianzas; H) LA PARTE OBLIGADA señala como lugar para recibir notificaciones en la <mark>{{DIRECCION_NOTIFICACIONES}}</mark>.</p>
<p><strong>CUARTA:</strong> Los comparecientes declaran que aceptan el presente contrato.</p>
<p><mark>{{FIRMAS}}</mark></p>
<p><mark>{{AUTENTICA}}</mark></p>
`;

/* ── 3. CG Pública (Escritura) ── */
const CG_PUBLIC = `
<p style="text-align: center"><strong>NUMERO _________ (____). ESCRITURA PÚBLICA DE CONTRAGARANTÍA.</strong></p>
<p>En la ciudad de Guatemala, el <mark>{{FECHA_CONTRATO}}</mark>, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: ${FIDELIS_REP_PUBLIC}; "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada en lo sucesivo "LA AFIANZADORA"; Y POR OTRA PARTE: <mark>{{DATOS_FIADO}}</mark>, a quien en lo sucesivo se le denominará "EL FIADO"; Y: <mark>{{DATOS_FIADORES}}</mark>, a quienes se les denominará "LOS FIADORES SOLIDARIOS".</p>
<p><strong>PRIMERA:</strong> Manifiesta "EL FIADO" que ha solicitado a la entidad AFIANZADORA FIDELIS, SOCIEDAD ANÓNIMA, la emisión de la(s) <mark>{{DATOS_POLIZAS}}</mark>, a favor de <mark>{{BENEFICIARIO}}</mark>.</p>
<p><strong>SEGUNDA:</strong> Manifiesta LA PARTE OBLIGADA, que por este acto se compromete expresamente a pagar en forma mancomunada y solidaria a LA AFIANZADORA, cualquier cantidad de dinero que por razón de las fianzas emitidas, LA ENTIDAD BENEFICIARIA requiera de pago.</p>
<p><strong>TERCERA:</strong> LA PARTE OBLIGADA acepta las condiciones establecidas, señalando como lugar para recibir notificaciones la <mark>{{DIRECCION_NOTIFICACIONES}}</mark>.</p>
<p><mark>{{FIRMAS}}</mark></p>
`;

/* ── 4. Accesorio Múltiple ── */
const CG_MULTIPLE = `
<p style="text-align: center"><strong>GARANTÍA FIDUCIARIA PARA EMISIÓN MÚLTIPLE DE PÓLIZAS</strong></p>
<p>En adelante llamado(s) como LA PARTE OBLIGADA, expresa e irrevocablemente manifiesto (manifestamos) lo siguiente:</p>
<p><strong>A)</strong> Que la entidad ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA, en adelante LA AFIANZADORA, está en capacidad de expedir una serie de pólizas de fianza para garantizar las obligaciones cuya responsabilidad sea imputable al FIADO: <mark>{{DATOS_FIADO}}</mark>.</p>
<p>LA AFIANZADORA, al amparo del presente documento, está en capacidad de emitir fianzas a favor de la persona anteriormente indicada, hasta el monto acumulado de <mark>{{MONTO_MAXIMO}}</mark>.</p>
<p><strong>B)</strong> LA PARTE OBLIGADA, con motivo de las pólizas de fianza que sean emitidas, se obliga en forma mancomunada y solidaria a reintegrarle a LA AFIANZADORA cualquier cantidad de dinero que por concepto de las mismas tuviere que pagar.</p>
<p><strong>C)</strong> El plazo de la presente obligación es por el tiempo de vigencia de las pólizas de fianza que sean emitidas.</p>
<p><strong>D)</strong> LA PARTE OBLIGADA acepta que este documento constituye título ejecutivo suficiente.</p>
<p><strong>E)</strong> LA PARTE OBLIGADA señala como lugar para recibir notificaciones: <mark>{{DIRECCION_NOTIFICACIONES}}</mark>.</p>
<p><mark>{{FIRMAS}}</mark></p>
<p><mark>{{AUTENTICA}}</mark></p>
`;

/* ── 5. CG Mobiliaria ── */
const MOVABLE = `
<p style="text-align: center"><strong>NUMERO _________ (____). ESCRITURA PÚBLICA DE CONTRAGARANTÍA CON GARANTÍA MOBILIARIA.</strong></p>
<p>En la ciudad de Guatemala, el <mark>{{FECHA_CONTRATO}}</mark>, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: ${FIDELIS_REP_PUBLIC}; Y POR OTRA PARTE: <mark>{{DATOS_FIADO}}</mark>; Y: <mark>{{DATOS_FIADORES}}</mark>.</p>
<p><strong>PRIMERA:</strong> Declara LA PARTE OBLIGADA, que LA AFIANZADORA, emitió las pólizas de fianza: <mark>{{DATOS_POLIZAS}}</mark> cuya responsabilidad es imputable a <mark>{{DATOS_FIADO}}</mark> ante el <mark>{{BENEFICIARIO}}</mark>.</p>
<p><strong>SEGUNDA:</strong> LA PARTE OBLIGADA se compromete a pagar en forma mancomunada y solidaria a LA AFIANZADORA cualquier cantidad requerida.</p>
<p><strong>TERCERA:</strong> Como garantía del cumplimiento de las obligaciones, LA PARTE OBLIGADA constituye GARANTÍA MOBILIARIA sobre los siguientes bienes muebles: <mark>{{BIENES_MUEBLES}}</mark>, con un valor estimado de <mark>{{VALOR_BIENES}}</mark>, ubicados en <mark>{{UBICACION_BIENES}}</mark>.</p>
<p><strong>CUARTA:</strong> LA PARTE OBLIGADA señala como lugar para recibir notificaciones: <mark>{{DIRECCION_NOTIFICACIONES}}</mark>.</p>
<p><mark>{{FIRMAS}}</mark></p>
`;

/* ── 6. Hipoteca ── */
const MORTGAGE = `
<p style="text-align: center"><strong>NUMERO _________ (____). ESCRITURA PÚBLICA DE CONSTITUCIÓN DE GARANTÍA HIPOTECARIA.</strong></p>
<p>En la ciudad de Guatemala, el <mark>{{FECHA_CONTRATO}}</mark>, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: ${FIDELIS_REP_PUBLIC}; Y POR OTRA PARTE: <mark>{{DATOS_FIADO}}</mark>.</p>
<p><strong>PRIMERA:</strong> Declara LA PARTE OBLIGADA, que LA AFIANZADORA emitió la póliza de fianza: <mark>{{DATOS_POLIZAS}}</mark> cuya responsabilidad es imputable a <mark>{{DATOS_FIADO}}</mark> ante <mark>{{BENEFICIARIO}}</mark>.</p>
<p><strong>SEGUNDA:</strong> LA PARTE OBLIGADA se compromete a pagar en forma mancomunada y solidaria a LA AFIANZADORA.</p>
<p><strong>TERCERA:</strong> Como garantía, LA PARTE OBLIGADA constituye HIPOTECA sobre la finca inscrita en el <mark>{{DATOS_FINCA}}</mark>, a favor de ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA.</p>
<p><strong>CUARTA:</strong> LA PARTE OBLIGADA señala como lugar para recibir notificaciones: <mark>{{DIRECCION_NOTIFICACIONES}}</mark>.</p>
<p><mark>{{FIRMAS}}</mark></p>
`;

/* ── 7. Carta de Pago ── */
const PAYMENT_RELEASE = `
<p style="text-align: center"><strong>NUMERO _________ (____). CARTA DE PAGO TOTAL Y LIBERACIÓN DE GRAVAMEN HIPOTECARIO.</strong></p>
<p>En la Ciudad de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. ANTE MI: ________________________, Notario, comparece el señor BRASIL HAROLDO ARENAS MORALES, de sesenta y tres años de edad, casado, guatemalteco, Ejecutivo, de este domicilio, quien se identifica con el DPI-CUI (2646 15263 0101), quien actúa en su calidad de GERENTE GENERAL Y REPRESENTANTE LEGAL de "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA". DOY FE de la representación ejercitada.</p>
<p><strong>PRIMERA:</strong> Manifiesta el señor BRASIL HAROLDO ARENAS MORALES, en la calidad con que actúa, que mediante la escritura pública número <mark>{{ESCRITURA_ORIGEN}}</mark>, se constituyó a favor de Aseguradora Fidelis, Sociedad Anónima, Hipoteca sobre la finca inscrita en el <mark>{{DATOS_FINCA}}</mark>.</p>
<p><strong>SEGUNDA:</strong> Por haberse cumplido las obligaciones, otorga CARTA DE PAGO TOTAL y LIBERACIÓN DE GRAVAMEN HIPOTECARIO, solicitando al Registrador la cancelación de la inscripción hipotecaria.</p>
<p><strong>TERCERA:</strong> El otorgante declara que sobre la hipoteca no pesan gravámenes, anotaciones ni limitaciones.</p>
<p><mark>{{FIRMAS}}</mark></p>
`;

/* ── 8. Depósito de Fondos ── */
const FUND_DEPOSIT = `
<p>En la Ciudad de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. Comparecemos por una parte: ${FIDELIS_REP}. La entidad "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada en lo sucesivo "LA AFIANZADORA", y por la otra parte comparece: <mark>{{DATOS_FIADO}}</mark>, en lo sucesivo "LA PARTE DEPOSITANTE".</p>
<p>HACEMOS CONSTAR que otorgamos un CONTRATO DE DEPÓSITO DE FONDOS EN GARANTÍA contenido en las siguientes cláusulas:</p>
<p><strong>PRIMERA:</strong> LA AFIANZADORA emitió la póliza de fianza: <mark>{{DATOS_POLIZAS}}</mark> cuya responsabilidad es imputable a <mark>{{DATOS_FIADO}}</mark> ante <mark>{{BENEFICIARIO}}</mark>.</p>
<p><strong>SEGUNDA:</strong> LA PARTE DEPOSITANTE realiza depósito monetario en caja de LA AFIANZADORA por la cantidad de <mark>{{DATOS_DEPOSITO}}</mark>, como garantía para cubrir posibles reclamaciones.</p>
<p><strong>TERCERA:</strong> El depósito devengará un interés de <mark>{{TASA_INTERES}}</mark> anual. LA AFIANZADORA se obliga a devolver el depósito una vez concluidas las obligaciones afianzadas.</p>
<p><mark>{{FIRMAS}}</mark></p>
<p><mark>{{AUTENTICA}}</mark></p>
`;

/* ── 9. Finiquito por Reclamo ── */
const CLAIM_SETTLEMENT = `
<p style="text-align: center"><strong>NUMERO _________ (____). FINIQUITO.</strong></p>
<p>En la ciudad de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. ANTE MI: ________________________, Notario, comparece <mark>{{DATOS_FIADO}}</mark>. DOY FE de la representación ejercitada.</p>
<p><strong>PRIMERA:</strong> Expresa el compareciente que la entidad ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA, emitió la póliza de fianza: <mark>{{DATOS_POLIZAS}}</mark>, imputable a <mark>{{SUBROGACION_CONTRA}}</mark>, ante <mark>{{BENEFICIARIO}}</mark>.</p>
<p><strong>SEGUNDA:</strong> En virtud de incumplimiento, su representada presentó reclamo a ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA.</p>
<p><strong>TERCERA:</strong> ASEGURADORA FIDELIS pagó la cantidad de <mark>{{DATOS_INDEMNIZACION}}</mark> en concepto de indemnización, según cheque <mark>{{DATOS_CHEQUE}}</mark>.</p>
<p><strong>CUARTA:</strong> El compareciente acepta el pago y otorga a ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA, el más firme FINIQUITO TOTAL, relevándola de cualquier responsabilidad ulterior, con pacto de no pedir.</p>
<p><strong>QUINTA:</strong> En virtud del pago, el compareciente subroga en ASEGURADORA FIDELIS todos los derechos y acciones contra <mark>{{SUBROGACION_CONTRA}}</mark>.</p>
<p><mark>{{FIRMAS}}</mark></p>
`;

/* ── 10. Finiquito Devolución Individual ── */
const FUND_RETURN_IND = `
<p>En la Ciudad de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. Comparecemos por una parte: ${FIDELIS_REP}. "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada "LA AFIANZADORA", y por la otra parte, comparezco <mark>{{DATOS_FIADO}}</mark>, actuando en lo personal, en lo sucesivo "LA PARTE DEPOSITANTE".</p>
<p>HACEMOS CONSTAR que otorgamos un FINIQUITO POR DEVOLUCIÓN DE FONDOS EN GARANTÍA contenido en las siguientes cláusulas:</p>
<p><strong>PRIMERA:</strong> ANTECEDENTES: LA AFIANZADORA emitió la póliza: <mark>{{DATOS_POLIZAS}}</mark>. En garantía, LA PARTE DEPOSITANTE realizó depósito: <mark>{{DATOS_DEPOSITO}}</mark>.</p>
<p><strong>SEGUNDA:</strong> DEVOLUCIÓN DE FONDOS Y FINIQUITO TOTAL: Son devueltos a LA PARTE DEPOSITANTE los fondos depositados junto con su respectivo interés, formalizándose mediante cheque que tiene por recibido a entera satisfacción.</p>
<p><strong>TERCERA:</strong> Las partes se otorgan mutuamente el más amplio FINIQUITO TOTAL.</p>
<p><mark>{{FIRMAS}}</mark></p>
<p><mark>{{AUTENTICA}}</mark></p>
`;

/* ── 11. Finiquito Devolución Sociedad ── */
const FUND_RETURN_ENT = `
<p>En la Ciudad de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. Comparecemos por una parte: ${FIDELIS_REP}. "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada "LA AFIANZADORA", y por la otra parte, comparezco <mark>{{DATOS_FIADO}}</mark>, en lo sucesivo "LA PARTE DEPOSITANTE".</p>
<p>HACEMOS CONSTAR que otorgamos un FINIQUITO POR DEVOLUCIÓN DE FONDOS EN GARANTÍA contenido en las siguientes cláusulas:</p>
<p><strong>PRIMERA:</strong> ANTECEDENTES: LA AFIANZADORA emitió la póliza: <mark>{{DATOS_POLIZAS}}</mark>. En garantía, la entidad por medio de su representante legal realizó depósito: <mark>{{DATOS_DEPOSITO}}</mark>.</p>
<p><strong>SEGUNDA:</strong> DEVOLUCIÓN DE FONDOS Y FINIQUITO TOTAL: Son devueltos a la entidad, por medio de su representante legal, los fondos depositados formalizándose mediante cheque.</p>
<p><strong>TERCERA:</strong> Las partes se otorgan mutuamente el más amplio FINIQUITO TOTAL.</p>
<p><mark>{{FIRMAS}}</mark></p>
<p><mark>{{AUTENTICA}}</mark></p>
`;

/* ── 12. Reconocimiento de Deuda ── */
const DEBT_RECOGNITION = `
<p style="text-align: center"><strong>NUMERO _________ (____). RECONOCIMIENTO DE DEUDA PURO Y SIMPLE.</strong></p>
<p>En la Ciudad de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. ANTE MI: ________________________, Notario, comparece por una parte: ${FIDELIS_REP_PUBLIC}. "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada "LA AFIANZADORA" o "LA ACREEDORA"; por otra parte comparece: <mark>{{DATOS_FIADO}}</mark>, en la presente escritura podrá ser llamado "LA PARTE DEUDORA".</p>
<p><strong>PRIMERA:</strong> Manifiesta expresamente LA PARTE DEUDORA, que se reconoce LISO Y LLANO DEUDOR de ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA, por la cantidad de <mark>{{MONTO_DEUDA}}</mark>.</p>
<p><strong>SEGUNDA:</strong> PLAZO: El plazo de la obligación es de <mark>{{PLAZO}}</mark>, contados a partir del <mark>{{FECHA_INICIO}}</mark>, venciendo el <mark>{{FECHA_VENCIMIENTO}}</mark>.</p>
<p><strong>TERCERA:</strong> CUOTAS: El monto será cancelado mediante <mark>{{DATOS_CUOTAS}}</mark>. La obligación generará un interés del <mark>{{TASA_INTERES}}</mark>.</p>
<p><strong>CUARTA:</strong> OTRAS CONDICIONES: a) Se pagará sin requerimiento en las oficinas de LA AFIANZADORA; b) El presente instrumento constituye título ejecutivo; c) La PARTE DEUDORA renuncia al fuero de su domicilio.</p>
<p><mark>{{FIRMAS}}</mark></p>
`;

export const defaultTemplates: Record<ContractType, string> = {
  [ContractType.COUNTER_GUARANTEE_PRIVATE]: CG_PRIVATE_INDIVIDUAL,
  [ContractType.COUNTER_GUARANTEE_PRIVATE_ENTITY]: CG_PRIVATE_ENTITY,
  [ContractType.COUNTER_GUARANTEE_PUBLIC]: CG_PUBLIC,
  [ContractType.COUNTER_GUARANTEE_MULTIPLE]: CG_MULTIPLE,
  [ContractType.MOVABLE_GUARANTEE]: MOVABLE,
  [ContractType.MORTGAGE_GUARANTEE]: MORTGAGE,
  [ContractType.PAYMENT_RELEASE]: PAYMENT_RELEASE,
  [ContractType.FUND_DEPOSIT]: FUND_DEPOSIT,
  [ContractType.CLAIM_SETTLEMENT]: CLAIM_SETTLEMENT,
  [ContractType.FUND_RETURN_INDIVIDUAL]: FUND_RETURN_IND,
  [ContractType.FUND_RETURN_ENTITY]: FUND_RETURN_ENT,
  [ContractType.DEBT_RECOGNITION]: DEBT_RECOGNITION,
};

export function getDefaultTemplate(type: ContractType) {
  return defaultTemplates[type] ?? defaultTemplates[ContractType.COUNTER_GUARANTEE_PRIVATE];
}
