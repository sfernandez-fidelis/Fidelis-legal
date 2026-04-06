import React, { useState, useEffect } from 'react';
import { ContractType } from '../types';
import { useTemplates } from '../contexts/TemplateContext';
import { Save, AlertCircle, Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { toast } from 'sonner';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

import Highlight from '@tiptap/extension-highlight';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const insertVariable = (variable: string) => {
    editor.chain().focus().insertContent(`<mark>{{${variable}}}</mark>`).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          title="Negrita"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          title="Cursiva"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          title="Subrayado"
        >
          <UnderlineIcon size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          title="Alinear a la izquierda"
        >
          <AlignLeft size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          title="Centrar"
        >
          <AlignCenter size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          title="Alinear a la derecha"
        >
          <AlignRight size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          title="Justificar"
        >
          <AlignJustify size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 pl-2">
        <span className="text-sm font-medium text-gray-600">Insertar Variable:</span>
        <select 
          onChange={(e) => {
            if (e.target.value) {
              insertVariable(e.target.value);
              e.target.value = '';
            }
          }}
          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">-- Seleccionar --</option>
          <option value="FECHA_CONTRATO">Fecha del Contrato</option>
          <option value="DATOS_FIADO">Datos del Fiado</option>
          <option value="DATOS_FIADORES">Datos de Fiadores</option>
          <option value="DATOS_POLIZAS">Datos de Pólizas</option>
          <option value="BENEFICIARIO">Beneficiario</option>
          <option value="DIRECCION_NOTIFICACIONES">Dirección Notificaciones</option>
          <option value="FIRMAS">Bloque de Firmas</option>
          <option value="AUTENTICA">Acta de Auténtica</option>
        </select>
      </div>
    </div>
  );
};

export default function TemplateEditor() {
  const { templates, saveTemplate, loading } = useTemplates();
  const [selectedType, setSelectedType] = useState<ContractType>(ContractType.COUNTER_GUARANTEE_PRIVATE);
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4',
      },
    },
  });

  // Load template when type changes
  useEffect(() => {
    if (!editor) return;

    const template = templates.find(t => t.type === selectedType);
    let contentToSet = '';

    if (template && template.content && template.content.trim() !== '') {
      contentToSet = template.content;
    } else {
      switch (selectedType) {
        case ContractType.COUNTER_GUARANTEE_PRIVATE:
          contentToSet = `
  <p>En la Ciudad de Guatemala, departamento de Guatemala, el día <mark>{{FECHA_CONTRATO}}</mark>. Comparecemos por una parte: BRASIL HAROLDO ARENAS MORALES, de sesenta y tres años de edad, casado, guatemalteco, Ejecutivo, con domicilio en el departamento de Guatemala, identificándome con el Documento Personal de Identificación -DPI- con código único de identificación -CUI- dos mil seiscientos cuarenta y seis, quince mil doscientos sesenta y tres, cero ciento uno (2646 15263 0101), extendido por el Registro Nacional de las Personas, de la República de Guatemala, actuando en mi calidad de GERENTE GENERAL Y REPRESENTANTE LEGAL, de la entidad denominada "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", lo cual acredito con el Acta Notarial de mi nombramiento autorizada en la ciudad de Guatemala por el Notario Juan Carlos Díaz Monroy, el veintidós de abril del año dos mil diecinueve, inscrita en el Registro Mercantil General de la República al número quinientos sesenta mil trescientos setenta y seis (560376), folio trescientos setenta y siete (377) del libro setecientos once (711) de Auxiliares de Comercio. La entidad "ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA", será llamada en lo sucesivo "LA AFIANZADORA", y por la otra parte comparece: <mark>{{DATOS_FIADO}}</mark>; y <mark>{{DATOS_FIADORES}}</mark>.</p>
  <p>Las entidades comparecientes, podrán ser llamadas en el transcurso del presente documento como "LA PARTE OBLIGADA"; HACEMOS CONSTAR: a) de que los comparecientes aseguramos ser de las generales indicadas y encontrarnos en el libre ejercicio de nuestros derechos civiles; b) que tenemos a la vista la documentación fehaciente y que toda representación que se ejercita es suficiente conforme a la ley y a nuestro juicio para el presente acto; c) Los comparecientes manifestamos que otorgamos un contrato de CONTRAFIANZA, CON GARANTÍA FIDUCIARIA EN DOCUMENTO PRIVADO CON FIRMAS LEGALIZADAS, contenida en las siguientes cláusulas:</p>
  <p><strong>PRIMERA:</strong> Declara LA PARTE OBLIGADA, que LA AFIANZADORA, emitió las pólizas de fianza: <mark>{{DATOS_POLIZAS}}</mark> ante el <mark>{{BENEFICIARIO}}</mark>, entidad que es beneficiaria de las citadas pólizas de fianza.</p>
  <p><strong>SEGUNDA:</strong> Manifiesta además LA PARTE OBLIGADA, que por este acto se compromete expresamente a pagar en forma mancomunada y solidaria a LA AFIANZADORA, sobre cualquier cantidad de dinero, gastos de reclamación, gastos de ajustes, impuestos u otros gastos, así como el interés legal y costas si fuere el caso que por razón o con cargo a las fianzas emitidas y descritas en el presente documento, LA ENTIDAD BENEFICIARIA, requiera de pago a LA AFIANZADORA...</p>
  <p><strong>TERCERA:</strong> LA PARTE OBLIGADA acepta expresamente que: A) Todo pago lo hará en las Oficinas Centrales de LA AFIANZADORA... J) LA PARTE OBLIGADA señala como lugar para recibir notificaciones en la <mark>{{DIRECCION_NOTIFICACIONES}}</mark>, siendo válidas las que en dicho lugar se le haga...</p>
  <p><strong>CUARTA:</strong> Los comparecientes con las calidades con que actúan declaran que en los términos relacionados aceptan el presente contrato y el señor BRASIL HAROLDO ARENAS MORALES, en la calidad con que actúa, a nombre de su representada acepta la garantía constituida a favor de ASEGURADORA FIDELIS, SOCIEDAD ANÓNIMA. Los comparecientes HACEMOS CONSTAR: a) todo lo expuesto, b) de haber tenido a la vista la documentación antes relacionada y c) que damos íntegra lectura a lo escrito, y enterados de su contenido, objeto, validez y demás efectos legales, lo aceptamos, ratificamos y firmamos.</p>
  <p><mark>{{FIRMAS}}</mark></p>
  <p><mark>{{AUTENTICA}}</mark></p>`;
          break;
        case ContractType.COUNTER_GUARANTEE_PUBLIC:
          contentToSet = `
  <p style="text-align: center"><strong>NUMERO _________ (____). ESCRITURA PÚBLICA DE CONTRAGARANTÍA.</strong></p>
  <p>En la ciudad de Guatemala, el <mark>{{FECHA_CONTRATO}}</mark>, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: <mark>{{DATOS_FIADO}}</mark>, a quien en lo sucesivo se le denominará "EL FIADO"; Y POR OTRA PARTE: <mark>{{DATOS_FIADORES}}</mark>, a quienes se les denominará "LOS FIADORES SOLIDARIOS"...</p>
  <p><strong>PRIMERA:</strong> Manifiesta "EL FIADO" que ha solicitado a la entidad AFIANZADORA FIDELIS, SOCIEDAD ANÓNIMA, la emisión de la(s) <mark>{{DATOS_POLIZAS}}</mark>, a favor de <mark>{{BENEFICIARIO}}</mark>.</p>
  <p><mark>{{FIRMAS}}</mark></p>`;
          break;
        case ContractType.MORTGAGE_GUARANTEE:
          contentToSet = `
  <p style="text-align: center"><strong>NUMERO _________ (____). ESCRITURA PÚBLICA DE CONSTITUCIÓN DE GARANTÍA HIPOTECARIA.</strong></p>
  <p>En la ciudad de Guatemala, el <mark>{{FECHA_CONTRATO}}</mark>, Ante Mí: ________________________, Notario, comparecen: POR UNA PARTE: <mark>{{DATOS_FIADO}}</mark>, a quien en lo sucesivo se le denominará "EL DEUDOR HIPOTECARIO"...</p>
  <p><mark>{{FIRMAS}}</mark></p>`;
          break;
      }
    }

    // Convert any raw {{VAR}} to badges if they aren't already
    contentToSet = contentToSet.replace(/(?<!<mark>)\{\{([^}]+)\}\}(?!<\/mark>)/g, '<mark>{{$1}}</mark>');

    editor.commands.setContent(contentToSet);
  }, [selectedType, templates, editor]);

  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const htmlContent = editor.getHTML();
      await saveTemplate(selectedType, htmlContent);
      toast.success('Plantilla guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la plantilla');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando plantillas...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif italic text-gray-900">Editor de Plantillas</h2>
          <p className="text-gray-500 mt-1">Modifique el texto base de los contratos de forma visual.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-black transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4 space-y-4">
          <h3 className="font-medium text-gray-900">Tipo de Contrato</h3>
          <div className="space-y-2">
            {Object.values(ContractType).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                  selectedType === type 
                    ? 'bg-gray-900 text-white font-medium' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type === ContractType.COUNTER_GUARANTEE_PRIVATE && 'Contragarantía Privada'}
                {type === ContractType.COUNTER_GUARANTEE_PUBLIC && 'Contragarantía Escritura Pública'}
                {type === ContractType.MORTGAGE_GUARANTEE && 'Hipoteca'}
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              Variables Disponibles
            </div>
            <p className="text-blue-600 text-xs leading-relaxed">
              Use el menú superior para insertar variables. Serán reemplazadas automáticamente al generar el documento.
            </p>
          </div>
        </div>

        <div className="w-full md:w-3/4 flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contenido de la Plantilla
          </label>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col">
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto max-h-[600px] bg-white">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
