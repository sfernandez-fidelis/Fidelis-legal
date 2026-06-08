select
    CASE 
        WHEN mg.cod_tipo_cliente = 1 THEN 'INDIVIDUAL'
        WHEN mg.cod_tipo_cliente = 2 THEN 'EMPRESA'
        ELSE 'OTRO'
    END AS tipo_cliente,
    mg.cod_contacto cod_contacto_cliente,
    main_fusa.pkg_general.nombre_contacto(mg.cod_contacto) nombre_cliente,
    main_fusa.f_devuelve_dpi(mg.cod_contacto) dpi_cliente,
    mg.nit nit_cliente,
    rp.cod_contacto_repre_legal cod_contacto_repre,
    main_fusa.pkg_general.nombre_contacto(rp.cod_contacto_repre_legal) nombre_representante

from main_fusa.mg_contactos mg
inner join main_fusa.mg_representante_legal rp on mg.cod_contacto = rp.cod_contacto