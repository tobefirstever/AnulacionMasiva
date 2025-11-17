
$(function () {

 
    function initDatepickersIn($root) {
        if (!$.fn.datepicker) return;
        $root.find('[data_datepicker]').datepicker({
            format: 'dd/mm/yyyy', language: 'es', autoclose: true, todayHighlight: true
        });
    }
    function readFilters($root) {
        return {
            estado: $root.find('[data_filter="estado"]').val(),
            rolCreador: $root.find('[data_filter="rol"]').val(),
            fechaInicio: $root.find('[data_filter="desde"]').val(),
            fechaFin: $root.find('[data_filter="hasta"]').val()
        };
    }

 
    initDatepickersIn($('#tabBusqueda'));
    initDatepickersIn($('#tabExcel'));

    // ---------------------------------------------------------------------------
    // -----------------  TAB 1: Por Búsqueda (tu código actual)  ----------------
    // ---------------------------------------------------------------------------

    var selectedIds = {}; // diccionario (clave: NumeroOrden)
    function addSel(id) { selectedIds[id] = true; }
    function removeSel(id) { delete selectedIds[id]; }
    function isSel(id) { return !!selectedIds[id]; }
    function clearSel() { selectedIds = {}; }

    function getTotalFiltered(dt) { return dt.rows({ search: 'applied' }).count(); }
    function countSelectedInFiltered(dt) {
        var c = 0;
        dt.rows({ search: 'applied' }).every(function () {
            var d = this.data();
            if (d && isSel(d.NumeroOrden)) c++;
        });
        return c;
    }
    function selectPage(dt) {
        dt.rows({ page: 'current' }).every(function () {
            var d = this.data(); if (d) addSel(d.NumeroOrden);
        });
    }
    function deselectPage(dt) {
        dt.rows({ page: 'current' }).every(function () {
            var d = this.data(); if (d) removeSel(d.NumeroOrden);
        });
    }
    function selectAllFiltered(dt) {
        dt.rows({ search: 'applied' }).every(function () {
            var d = this.data(); if (d) addSel(d.NumeroOrden);
        });
    }
    function deselectAllFiltered(dt) {
        dt.rows({ search: 'applied' }).every(function () {
            var d = this.data(); if (d) removeSel(d.NumeroOrden);
        });
    }

    // Marca/desmarca checkboxes visibles + clase row-selected
    function syncPageCheckboxes(dt) {
        $('#tblOrdenes tbody tr').each(function () {
            var $tr = $(this);
            var $chk = $tr.find('input.row-check');
            var id = $chk.data('id');
            var checked = isSel(id);
            $chk.prop('checked', checked);
            $tr.toggleClass('row-selected', checked);
        });
    }

    function updateHeaderCheckbox(dt) {
        var totalFiltered = getTotalFiltered(dt);
        var selectedFiltered = countSelectedInFiltered(dt);

        var pageNodes = dt.rows({ page: 'current' }).nodes().to$().find('input.row-check');
        var pageChecked = 0; pageNodes.each(function () { if (this.checked) pageChecked++; });

        var $chkAll = $('#chkAll').prop('indeterminate', false);
        if (selectedFiltered === 0) $chkAll.prop('checked', false);
        else if (selectedFiltered === totalFiltered && totalFiltered > 0) $chkAll.prop('checked', true);
        else $chkAll.prop('checked', false).prop('indeterminate', true);

        var pageFullySelected = pageNodes.length > 0 && pageChecked === pageNodes.length;
        var notAllFiltered = selectedFiltered < totalFiltered;

        $('#bulkHint').toggle(pageFullySelected && notAllFiltered);
        if (pageFullySelected && notAllFiltered) {
            $('#selPageCount').text(pageNodes.length);
            $('#totalFiltered').text(totalFiltered);
        }

        if (selectedFiltered > 0) {
            $('#selectionCount').text(selectedFiltered);
            $('#selectionBar').show();
        } else {
            $('#selectionBar').hide();
        }
    }

    function resetSelectionUI() {
        clearSel();
        $('#chkAll').prop('checked', false).prop('indeterminate', false);
        $('#bulkHint, #selectionBar').hide();
        syncPageCheckboxes(dt);
        updateHeaderCheckbox(dt);
    }

    if (!$.fn.DataTable) {
        console.error("DataTables no está cargado. Revisa el _Layout.");
        return;
    }

    var dt = $("#tblOrdenes").DataTable({
        paging: true, pageLength: 10,
        lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
        searching: false, info: true, ordering: false, autoWidth: false, deferRender: true,
        language: { url: "https://cdn.datatables.net/plug-ins/1.10.13/i18n/Spanish.json" },
        columnDefs: [{ targets: 0, className: "checkbox-cell", orderable: false }],
        dom: "<'row'<'col-sm-6'l><'col-sm-6 text-right'f>>t<'row'<'col-sm-6'i><'col-sm-6 text-right'p>>",
        data: [],
        columns: [
            { data: null, render: function (_, __, row) { return '<input type="checkbox" class="row-check" data-id="' + row.NumeroOrden + '"/>'; } },
            { data: "NumeroOrden" },
            { data: "TipoOrden" },
            { data: "NumeroCliente" }
        ],
        drawCallback: function () {
            $('#tblOrdenes tbody tr').each(function () {
                var id = $(this).find('input.row-check').data('id');
                $(this).toggleClass('row-selected', isSel && isSel(id));
            });
        }
    });

   
    $('#tabExcel').on('change', '[data-excel-file]', function () {
        var name = (this.files && this.files.length) ? this.files[0].name : '';
        $('#excelFileName').val(name);
    });

  
    $('#tabExcel [data-action="cancelar"]').on('click', function () {
        $('#excelFileName').val('');
    });


    $('#btnBrowseExcel').on('click', function () {
        $('#excelReal').click();
    });


    $('#excelReal').on('change', function () {
        var name = (this.files && this.files.length) ? this.files[0].name : '';
        $('#excelFileName').val(name);
    });


    // fila -> checkbox
    $('#tblOrdenes').on('change', 'input.row-check', function () {
        var $tr = $(this).closest('tr');
        $tr.toggleClass('row-selected', this.checked);
        var id = $(this).data('id');
        if (this.checked) addSel(id); else removeSel(id);
        updateHeaderCheckbox(dt);
    });

    // global
    var chkAllBeforeAllSelected = false;
    $('#chkAll').on('mousedown', function () {
        var totalFiltered = getTotalFiltered(dt);
        chkAllBeforeAllSelected = (countSelectedInFiltered(dt) === totalFiltered && totalFiltered > 0);
    });
    $('#chkAll').on('change', function () {
        if (this.checked) selectPage(dt);
        else {
            if (chkAllBeforeAllSelected) deselectAllFiltered(dt);
            else deselectPage(dt);
        }
        syncPageCheckboxes(dt);
        updateHeaderCheckbox(dt);
    });


    $('#selectAllFilteredLink').on('click', function (e) {
        e.preventDefault();
        selectAllFiltered(dt);
        syncPageCheckboxes(dt);
        updateHeaderCheckbox(dt);
        $('#bulkHint').hide();
    });
    $('#clearAllSel').on('click', function (e) {
        e.preventDefault();
        clearSel(); syncPageCheckboxes(dt); updateHeaderCheckbox(dt);
    });

    dt.on('draw', function () { syncPageCheckboxes(dt); updateHeaderCheckbox(dt); });

    
    $("#btnBuscar").on("click", function () {
        resetSelectionUI();
        var payload = {
            estado: $("#cboEstado").val(),
            rolCreador: $("#txtRolCreador").val(),
            fechaInicio: $("#dtpFechaInicio").val(),
            fechaFin: $("#dtpFechaFin").val()
        };
        $.ajax({
            url: $("#buscar-orden").data('request-url'),
            type: "POST",
            data: payload,
            success: function (r) {
                if (r && r.ok) { dt.clear(); dt.rows.add(r.data); dt.draw(); }
                else { alertify.error("No se pudo obtener información."); }
            },
            error: function () { alertify.error("Error en la consulta."); }
        });
    });

 
    $("#btnCancelar").on("click", function () {
        resetSelectionUI();
        $("#cboEstado").val("Todos");
        $("#txtRolCreador, #dtpFechaInicio, #dtpFechaFin").val("");
        dt.clear().draw();
    });


    $("#btnAnular").on("click", function () {
        var ids = Object.keys(selectedIds);
        if (ids.length === 0) { alertify.warning("Seleccione al menos una orden."); return; }

        alertify.confirm('Confirmar anulación masiva',
            'Se anularán ' + ids.length + ' órdenes seleccionadas. ¿Deseas continuar?',
            function onOk() {
                alertify.message('Procesando anulación… se descargará el Excel.');
                $("#hfSelectedCsv").val(ids.join(","));
                $("#btnAnular").prop('disabled', true);
                $("#frmAnularExcel").submit();

                setTimeout(function () {
                    resetSelectionUI();
                    $("#btnAnular").prop('disabled', false);
                    alertify.success('Se terminó el proceso de anulación');
                }, 1500);
            },
            function onCancel() { alertify.error('Operación cancelada'); }
        ).set('closable', true).set('movable', false).set('resizable', false)
            .set('labels', { ok: 'Sí, anular', cancel: 'Cancelar' });
    });

    // ---------------------------------------------------------------------------
    // -----------------  TAB 2: Por Archivo Excel  ------------------------------
    // ---------------------------------------------------------------------------

  
    $('#tabExcel [data-action="exportar"]').on('click', function () {
        var $root = $('#tabExcel');
        var f = readFilters($root);
        var $visibleFile = $root.find('[data-excel-file]');
        var file = $visibleFile[0].files[0];
        if (!file) { alertify.warning('Seleccione un archivo Excel.'); return; }

        // Copiamos archivo y filtros al form real y hacemos submit
        var $form = $('#frmUploadExcel');
        $form.find('input[name="Estado"]').val(f.estado);
        $form.find('input[name="RolCreador"]').val(f.rolCreador);
        $form.find('input[name="FechaInicio"]').val(f.fechaInicio);
        $form.find('input[name="FechaFin"]').val(f.fechaFin);


        var $hiddenFile = $('#hfExcelFile');
        try {
            $hiddenFile.replaceWith($visibleFile.clone().attr('id', 'hfExcelFile').attr('name', 'ArchivoExcel').show().css('display', 'none'));
        } catch (e) {
          
            $visibleFile.attr('name', 'ArchivoExcel');
            $form.append($visibleFile);
        }

        $form.submit();
    });


    $('#tabExcel [data-action="cancelar"]').on('click', function () {
        var $root = $('#tabExcel');
        $root.find('[data_filter="estado"]').val('Todos');
        $root.find('[data_filter="rol"]').val('');
        $root.find('[data_filter="desde"], [data_filter="hasta"]').val('');
        $root.find('[data-excel-file]').val('');
    });


    $('#tabExcel [data-action="anular"]').on('click', function () {
        $('#tabExcel [data-action="exportar"]').click();
    });
});
