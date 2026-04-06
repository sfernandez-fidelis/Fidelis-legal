import React, { useEffect, useState } from 'react';
import { AlertCircle, AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Save, Underline as UnderlineIcon } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { toast } from 'sonner';
import { ContractType, TemplateData } from '../types';
import { getDefaultTemplate } from '../features/templates/api/defaultTemplates';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const insertVariable = (variable: string) => {
    editor.chain().focus().insertContent(`<mark>{{${variable}}}</mark>`).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-t-xl border-b border-gray-200 bg-gray-50 p-2">
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          className={`rounded p-2 hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrita"
          type="button"
        >
          <Bold size={18} />
        </button>
        <button
          className={`rounded p-2 hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Cursiva"
          type="button"
        >
          <Italic size={18} />
        </button>
        <button
          className={`rounded p-2 hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Subrayado"
          type="button"
        >
          <UnderlineIcon size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          className={`rounded p-2 hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Alinear a la izquierda"
          type="button"
        >
          <AlignLeft size={18} />
        </button>
        <button
          className={`rounded p-2 hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Centrar"
          type="button"
        >
          <AlignCenter size={18} />
        </button>
        <button
          className={`rounded p-2 hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Alinear a la derecha"
          type="button"
        >
          <AlignRight size={18} />
        </button>
        <button
          className={`rounded p-2 hover:bg-gray-200 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          title="Justificar"
          type="button"
        >
          <AlignJustify size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 pl-2">
        <span className="text-sm font-medium text-gray-600">Insertar variable:</span>
        <select
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          onChange={(event) => {
            if (event.target.value) {
              insertVariable(event.target.value);
              event.target.value = '';
            }
          }}
        >
          <option value="">-- Seleccionar --</option>
          <option value="FECHA_CONTRATO">Fecha del contrato</option>
          <option value="DATOS_FIADO">Datos del fiado</option>
          <option value="DATOS_FIADORES">Datos de fiadores</option>
          <option value="DATOS_POLIZAS">Datos de pólizas</option>
          <option value="BENEFICIARIO">Beneficiario</option>
          <option value="DIRECCION_NOTIFICACIONES">Dirección notificaciones</option>
          <option value="FIRMAS">Bloque de firmas</option>
          <option value="AUTENTICA">Acta de auténtica</option>
        </select>
      </div>
    </div>
  );
};

interface TemplateEditorProps {
  templates: TemplateData[];
  loading: boolean;
  onSaveTemplate: (type: ContractType, content: string) => Promise<void>;
}

export default function TemplateEditor({ templates, loading, onSaveTemplate }: TemplateEditorProps) {
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

  useEffect(() => {
    if (!editor) {
      return;
    }

    const template = templates.find((item) => item.type === selectedType);
    let contentToSet = template?.content?.trim() ? template.content : getDefaultTemplate(selectedType);

    contentToSet = contentToSet.replace(/(?<!<mark>)\{\{([^}]+)\}\}(?!<\/mark>)/g, '<mark>{{$1}}</mark>');
    editor.commands.setContent(contentToSet);
  }, [editor, selectedType, templates]);

  const handleSave = async () => {
    if (!editor) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveTemplate(selectedType, editor.getHTML());
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif italic text-gray-900">Editor de plantillas</h2>
          <p className="mt-1 text-gray-500">Modifique el texto base de los contratos de forma visual.</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-white transition-all hover:bg-black disabled:opacity-50"
          disabled={isSaving}
          onClick={handleSave}
          type="button"
        >
          <Save className="h-5 w-5" />
          {isSaving ? 'Guardando...' : 'Guardar plantilla'}
        </button>
      </div>

      <div className="flex flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row">
        <div className="w-full space-y-4 md:w-1/4">
          <h3 className="font-medium text-gray-900">Tipo de contrato</h3>
          <div className="space-y-2">
            {Object.values(ContractType).map((type) => (
              <button
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  selectedType === type ? 'bg-gray-900 font-medium text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                key={type}
                onClick={() => setSelectedType(type)}
                type="button"
              >
                {type === ContractType.COUNTER_GUARANTEE_PRIVATE && 'Contragarantía Privada'}
                {type === ContractType.COUNTER_GUARANTEE_PUBLIC && 'Contragarantía Escritura Pública'}
                {type === ContractType.MORTGAGE_GUARANTEE && 'Hipoteca'}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              Variables disponibles
            </div>
            <p className="text-xs leading-relaxed text-blue-600">
              Use el menú superior para insertar variables. Serán reemplazadas automáticamente al generar el documento.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col md:w-3/4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Contenido de la plantilla</label>
          <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <MenuBar editor={editor} />
            <div className="max-h-[600px] flex-1 overflow-y-auto bg-white">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
