-- Habilitar la extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de Contratos (Counter Guarantees)
CREATE TABLE counter_guarantees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de Plantillas (Templates)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de Contactos (Contacts)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  party JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar Seguridad a Nivel de Fila (RLS)
ALTER TABLE counter_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Políticas para Contratos (Solo el dueño puede ver/editar)
CREATE POLICY "Usuarios pueden gestionar sus propios contratos"
  ON counter_guarantees FOR ALL USING (auth.uid() = user_id);

-- Políticas para Plantillas (Todos pueden leer, solo autenticados pueden editar)
CREATE POLICY "Cualquiera puede leer plantillas"
  ON templates FOR SELECT USING (true);
  
CREATE POLICY "Usuarios autenticados pueden actualizar plantillas"
  ON templates FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para Contactos (Solo el dueño puede ver/editar)
CREATE POLICY "Usuarios pueden gestionar sus propios contactos"
  ON contacts FOR ALL USING (auth.uid() = user_id);
