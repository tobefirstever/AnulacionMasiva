
$(function () {

   
    $('#btnBrowseExcel').on('click', function () {
        $('#excelReal').click();
    });


    $('#excelReal').on('change', function () {
        var name = (this.files && this.files.length) ? this.files[0].name : '';
        $('#excelFileName').val(name);
    });

   
    var dt = $('#tblResultado').DataTable({
        paging: true, searching: false, info: true, ordering: false, autoWidth: false,
        language: { url: 'https://cdn.datatables.net/plug-ins/1.10.13/i18n/Spanish.json' },
        data: [], columns: [
            { data: 'Row' },
            { data: 'NumeroOrden' },
            { data: 'Error' }
        ]
    });

    $('#btnValidar').on('click', function () {
        var f = $('#excelReal')[0];
        if (!f.files || !f.files.length) {
            alertify.warning('Seleccione un archivo .xlsx');
            return;
        }

        var file = f.files[0];
        var okExt = /\.xlsx$/i.test(file.name);
        if (!okExt) {
            alertify.error('Formato inválido. Solo .xlsx');
            return;
        }

        var fd = new FormData();
        fd.append('archivoExcel', file);

        $('#btnValidar').prop('disabled', true);
        alertify.message('Validando archivo…');

        $.ajax({
            url: '/ValidarExcel/Validar',
            type: 'POST',
            data: fd,
            processData: false,
            contentType: false,
            success: function (r) {
                if (!r || !r.ok) {
                    alertify.error(r && r.message ? r.message : 'No se pudo validar.');
                    return;
                }

                // cargar grilla
                dt.clear();
                dt.rows.add(r.items || []);
                dt.draw();

             
                $('#resumenValidacion').text(
                    'Total: ' + r.total + ' | Con errores: ' + r.conErrores
                );
                $('#resultadoPanel').show();

                if (r.conErrores === 0) alertify.success('Validación exitosa');
                else alertify.warning('Validación con observaciones');
            },
            error: function () {
                alertify.error('Error al validar el archivo.');
            },
            complete: function () {
                $('#btnValidar').prop('disabled', false);
            }
        });
    });

});
