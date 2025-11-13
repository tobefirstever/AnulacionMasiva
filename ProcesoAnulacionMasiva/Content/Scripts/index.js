// Espera DOM listo (evita correr antes de tiempo)
$(function () {

    var selectedIds = {}; // diccionario (clave: NumeroOrden)
    function addSel(id) { selectedIds[id] = true; }
    function removeSel(id) { delete selectedIds[id]; }
    function isSel(id) { return !!selectedIds[id]; }
    function clearSel() { selectedIds = {}; }

    function getTotalFiltered(dt) { return dt.rows({ search: 'applied' }).count(); }

    // Cuenta selección en el conjunto filtrado (todas las páginas)
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
            var d = this.data();
            if (d) addSel(d.NumeroOrden);
        });
    }

    function deselectPage(dt) {
        dt.rows({ page: 'current' }).every(function () {
            var d = this.data();
            if (d) removeSel(d.NumeroOrden);
        });
    }

    function selectAllFiltered(dt) {
        dt.rows({ search: 'applied' }).every(function () {
            var d = this.data();
            if (d) addSel(d.NumeroOrden);
        });
    }

    function deselectAllFiltered(dt) {
        dt.rows({ search: 'applied' }).every(function () {
            var d = this.data();
            if (d) removeSel(d.NumeroOrden);
        });
    }


    // Marca/desmarca checkboxes visibles según selectedIds
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


    // Actualiza estado del checkbox global (3 estados)
    function updateHeaderCheckbox(dt) {
        var totalFiltered = getTotalFiltered(dt);
        var selectedFiltered = countSelectedInFiltered(dt);

        var pageNodes = dt.rows({ page: 'current' }).nodes().to$().find('input.row-check');
        var pageChecked = 0; pageNodes.each(function () { if (this.checked) pageChecked++; });

        var $chkAll = $('#chkAll').prop('indeterminate', false);

        if (selectedFiltered === 0) {
            $chkAll.prop('checked', false);
        } else if (selectedFiltered === totalFiltered && totalFiltered > 0) {
            $chkAll.prop('checked', true);
        } else {
            $chkAll.prop('checked', false).prop('indeterminate', true);
        }

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



    // --- Datepicker (Bootstrap Datepicker) ---
    if (!$.fn.datepicker) {
        console.error("Bootstrap Datepicker no está cargado. Revisa el _Layout.");
    } else {
        $('#dtpFechaInicio, #dtpFechaFin').datepicker({
            format: 'dd/mm/yyyy',
            language: 'es',
            autoclose: true,
            todayHighlight: true
        });
    }

    // --- DataTable (requiere DataTables 1.10.13 cargado en Layout) ---
    if (!$.fn.DataTable) {
        console.error("DataTables no está cargado. Revisa el _Layout.");
        return;
    }

    // -------------- INTEGRACIÓN CON TU TABLA --------------

    var dt = $("#tblOrdenes").DataTable({
        paging: true,
        pageLength: 10,
        lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
        searching: false,
        info: true,
        ordering: false,
        autoWidth: false,
        deferRender: true, // mejora de rendimiento
        language: { url: "https://cdn.datatables.net/plug-ins/1.10.13/i18n/Spanish.json" },
        columnDefs: [{ targets: 0, className: "checkbox-cell", orderable: false }],
        // Layout Bootstrap: l=length, f=filter, t=table, i=info, p=pagination
        dom: "<'row'<'col-sm-6'l><'col-sm-6 text-right'f>>" +
            "t" +
            "<'row'<'col-sm-6'i><'col-sm-6 text-right'p>>",
        data: [],
        columns: [
            {
                data: null,
                render: function (_, __, row) { return '<input type="checkbox" class="row-check" data-id="' + row.NumeroOrden + '"/>'; }
            },
            { data: "NumeroOrden" },
            { data: "TipoOrden" },
            { data: "NumeroCliente" }
        ],
        drawCallback: function () {
            // Reaplica estado visual de selección en cada redibujado
            $('#tblOrdenes tbody tr').each(function () {
                var id = $(this).find('input.row-check').data('id');
                $(this).toggleClass('row-selected', isSel && isSel(id)); // usa tu modelo selectedIds
            });
        }
    });

    // Cuando cambia un checkbox de fila
    $('#tblOrdenes').on('change', 'input.row-check', function () {

        var $tr = $(this).closest('tr');
        $tr.toggleClass('row-selected', this.checked);

        var id = $(this).data('id');
        if (this.checked) addSel(id); else removeSel(id);
        updateHeaderCheckbox(dt);
    });



  


    // Capturamos el estado antes del change del checkbox global
    var chkAllBeforeAllSelected = false;
    $('#chkAll').on('mousedown', function () {
        var totalFiltered = getTotalFiltered(dt);
        chkAllBeforeAllSelected = (countSelectedInFiltered(dt) === totalFiltered && totalFiltered > 0);
    });

    // Checkbox global -> select page o clear según estado previo
    $('#chkAll').on('change', function () {
        var checked = this.checked;
        if (checked) {
            // Marcar página actual
            selectPage(dt);
        } else {
            // Si ANTES estaba "todos seleccionados", deselecciona TODO.
            if (chkAllBeforeAllSelected) {
                deselectAllFiltered(dt);
            } else {
                // Si solo estaba la página, deselecciona página
                deselectPage(dt);
            }
        }
        syncPageCheckboxes(dt);
        updateHeaderCheckbox(dt);
    });

    // Link del hint: “Seleccionar todos”
    $('#selectAllFilteredLink').on('click', function (e) {
        e.preventDefault();
        selectAllFiltered(dt);
        syncPageCheckboxes(dt);
        updateHeaderCheckbox(dt);
        $('#bulkHint').hide();
    });

    // Botón “Quitar selección (N)”
    $('#clearAllSel').on('click', function (e) {
        e.preventDefault();
        clearSel();
        syncPageCheckboxes(dt);
        updateHeaderCheckbox(dt);
    });

    // En cada draw, re-sincroniza la página
    dt.on('draw', function () {
        syncPageCheckboxes(dt);
        updateHeaderCheckbox(dt);
    });

    // Buscar
    $("#btnBuscar").on("click", function () {

        resetSelectionUI();
        $('#chkAll').prop('checked', false).prop('indeterminate', false);
        $('#bulkHint, #selectionBar').hide();

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
                if (r && r.ok) {
                    $("#chkAll").prop("checked", false);
                    dt.clear();
                    dt.rows.add(r.data);
                    dt.draw();
                } else {
                    alert("No se pudo obtener información.");
                }
            },
            error: function () { alert("Error en la consulta."); }
        });
    });

    // Cancelar
    $("#btnCancelar").on("click", function () {
        resetSelectionUI();
        $('#chkAll').prop('checked', false).prop('indeterminate', false);
        $('#bulkHint, #selectionBar').hide();

        $("#cboEstado").val("Todos");
        $("#txtRolCreador").val("");
        $("#dtpFechaInicio").val("");
        $("#dtpFechaFin").val("");
 
        dt.clear().draw();
    });

    // Anular (stub)
    $("#btnAnular").on("click", function () {
        var ids = Object.keys(selectedIds);
        

        if (ids.length === 0) {
            alertify.warning("Seleccione al menos una orden.");
            return;
        }

        alertify.confirm(
            'Confirmar anulación masiva',
            'Se anularán ' + ids.length + ' órdenes seleccionadas. ¿Deseas continuar?',
            function onOk() {
                alertify.message('Procesando anulación… se descargará el Excel.');

                // Submit + limpieza post-proceso
                $("#hfSelectedCsv").val(ids.join(","));
                $("#btnAnular").prop('disabled', true);
                $("#frmAnularExcel").submit();

                setTimeout(function () {
                    // ✅ Centraliza la limpieza visual y lógica
                    resetSelectionUI();
                    $("#btnAnular").prop('disabled', false);
                    $('#chkAll').prop('checked', false).prop('indeterminate', false);
                    $('#bulkHint, #selectionBar').hide();
                    $('#tblOrdenes input.row-check').prop('checked', false);
                  
                    alertify.success('Se terminó el proceso de anulación');
                }, 1500); // breve, solo feedback
            },
            function onCancel() {
                alertify.error('Operación cancelada');
            }
        )
            .set('closable', true)
            .set('movable', false)   // modal sobrio
            .set('resizable', false) // tamaño fijo (simétrico)
            .set('labels', { ok: 'Sí, anular', cancel: 'Cancelar' });

    });
});