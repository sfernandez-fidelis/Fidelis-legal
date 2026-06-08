SELECT
  a.AGENTE                                       AS numero_agente,
  TRIM(a.NOMBRE)                                 AS nombre,
  TRIM(a.E_MAIL)                                 AS email,
  TO_CHAR(COALESCE(a.CELULAR, a.TELEFONO))       AS telefono,
  a.REGISTRO_SIB                                 AS registro_sib,
  a.ESTADO                                       AS estado
FROM MAIN_FUSA.OLD_AGENTES a
WHERE a.ESTADO = 'A'           -- ajusta al valor real de "activo"
