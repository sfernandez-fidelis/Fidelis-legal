import { ContractType } from '../../../types';

export const defaultTemplates: Record<ContractType, string> = {
  [ContractType.COUNTER_GUARANTEE_PRIVATE]: `
    <p>En la Ciudad de Guatemala, departamento de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. Comparecemos por una parte: BRASIL HAROLDO ARENAS MORALES, de sesenta y tres años de edad, casado, guatemalteco, Ejecutivo, con domicilio en el departamento de Guatemala, identificándome con el Documento Personal de Identificación -DPI- con código único de identificación -CUI- dos mil seiscientos cuarenta y seis, quince mil doscientos sesenta y tres, cero ciento uno (2646 15263 0101), extendido por el Registro Nacional de las Personas, de la República de Guatemala, actuando en mi calidad de GERENTE GENERAL Y REPRESENTANTE LEGAL, de la entidad denominada "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", lo cual acredito con el Acta Notarial de mi nombramiento autorizada en la ciudad de Guatemala por el Notario Juan Carlos Díaz Monroy, el veintidós de abril del año dos mil diecinueve, inscrita en el Registro Mercantil General de la República al número quinientos sesenta mil trescientos setenta y seis (560376), folio trescientos setenta y siete (377) del libro setecientos once (711) de Auxiliares de Comercio. La entidad "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada en lo sucesivo "LA AFIANZADORA", y por la otra parte comparece: <mark>{{DATOS_FIADO}}</mark>; y <mark>{{DATOS_FIADORES}}</mark>.</p>
    <p>Las entidades comparecientes, podrán ser llamadas en el transcurso del presente documento como "LA PARTE OBLIGADA"; HACEMOS CONSTAR: a) de que los comparecientes aseguramos ser de las generales indicadas y encontrarnos en el libre ejercicio de nuestros derechos civiles; b) que tenemos a la vista la documentación fehaciente y que toda representación que se ejercita es suficiente conforme a la ley y a nuestro juicio para el presente acto; c) Los comparecientes manifestamos que otorgamos un contrato de CONTRAFIANZA, CON GARANTÍA FIDUCIARIA EN DOCUMENTO PRIVADO CON FIRMAS LEGALIZADAS, contenida en las siguientes cláusulas:</p>
    <p><strong>PRIMERA:</strong> Declara LA PARTE OBLIGADA, que LA AFIANZADORA, emitió las pólizas de fianza: <mark>{{DATOS_POLIZAS}}</mark> ante el <mark>{{BENEFICIARIO}}</mark>, entidad que es beneficiaria de las citadas pólizas de fianza.</p>
    <p><strong>SEGUNDA:</strong> Manifiesta además LA PARTE OBLIGADA, que por este acto se compromete expresamente a pagar en forma mancomunada y solidaria a LA AFIANZADORA, sobre cualquier cantidad de dinero, gastos de reclamación, gastos de ajustes, impuestos u otros gastos, así como el interés legal y costas si fuere el caso que por razón o con cargo a las fianzas emitidas y descritas en el presente documento, LA ENTIDAD BENEFICIARIA, requiera de pago a LA AFIANZADORA.</p>
    <p><strong>TERCERA:</strong> LA PARTE OBLIGADA acepta expresamente que todo pago lo hará en las oficinas centrales de LA AFIANZADORA y señala como lugar para recibir notificaciones la dirección <mark>{{DIRECCION_NOTIFICACIONES}}</mark>.</p>
    <p><strong>CUARTA:</strong> Los comparecientes con las calidades con que actúan declaran que en los términos relacionados aceptan el presente contrato. Los comparecientes hacemos constar todo lo expuesto y, enterados de su contenido, objeto, validez y demás efectos legales, lo aceptamos, ratificamos y firmamos.</p>
    <p><mark>{{FIRMAS}}</mark></p>
    <p><mark>{{AUTENTICA}}</mark></p>
  `,
  [ContractType.COUNTER_GUARANTEE_PUBLIC]: `
    <p style="text-align: center"><strong>NUMERO _________ (____). ESCRITURA PÚBLICA DE CONTRAGARANTÍA.</strong></p>
    <p>En la ciudad de Guatemala, el <mark>{{FECHA_CONTRATO}}</mark>, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: <mark>{{DATOS_FIADO}}</mark>, a quien en lo sucesivo se le denominará "EL FIADO"; Y POR OTRA PARTE: <mark>{{DATOS_FIADORES}}</mark>, a quienes se les denominará "LOS FIADORES SOLIDARIOS".</p>
    <p><strong>PRIMERA:</strong> Manifiesta "EL FIADO" que ha solicitado a la entidad AFIANZADORA FIDELIS, SOCIEDAD ANÓNIMA, la emisión de la(s) <mark>{{DATOS_POLIZAS}}</mark>, a favor de <mark>{{BENEFICIARIO}}</mark>.</p>
    <p><mark>{{FIRMAS}}</mark></p>
  `,
  [ContractType.MORTGAGE_GUARANTEE]: `
    <p style="text-align: center"><strong>NUMERO _________ (____). ESCRITURA PÚBLICA DE CONSTITUCIÓN DE GARANTÍA HIPOTECARIA.</strong></p>
    <p>En la ciudad de Guatemala, el <mark>{{FECHA_CONTRATO}}</mark>, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: <mark>{{DATOS_FIADO}}</mark>, a quien en lo sucesivo se le denominará "EL DEUDOR HIPOTECARIO".</p>
    <p><mark>{{FIRMAS}}</mark></p>
  `,
};

export function getDefaultTemplate(type: ContractType) {
  return defaultTemplates[type];
}
