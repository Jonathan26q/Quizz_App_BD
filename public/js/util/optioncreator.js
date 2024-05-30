let deletingBefore = false;

function addItem(title) {
    $("#total-list ul").children().each(function(index) {
        $(`#list-item-${index}`).attr("id", "list-item-" + (index + 1));
        $(`#submission-line-1-${index}`).attr("id", "submission-line-1-" + (index + 1));
        $(`#submission-line-2-${index}`).attr("id", "submission-line-2-" + (index + 1));
    });

    let isBooleanType = false;
    let isFillBlankType = false;

    if (title == "Verdadero" || title == "Falso") { 
        isBooleanType = true;
    } else if (title == "Llena los espacios") {
        isFillBlankType = true;
    }

    $('.list').prepend(`<li id="list-item-0" class="list__item flex" style="margin-top: 1%;">
    <div class="input-question-area">
        <${isFillBlankType ? "textarea" : "input"} value="${isBooleanType ? title : ""}" id="submission-line-1-0" class="submission-line__input" type="text" placeholder="${isFillBlankType ? "Usa %palabra% para indicar los espacios a llenar" : "Titulo de respuesta"}" ${isBooleanType ? "readonly" : ""}/>
        ${isBooleanType || isFillBlankType ? "" : `<input id="submission-line-2-0" class="submission-line__input" type="text" placeholder="Imagen URL (Opcional)"/>`}
    </div>

    <div class="total-height">
        ${isBooleanType || isFillBlankType ? "" : 
        `<div style="height:25%; margin-left:145%">
            <a class="list__delete-btn">&times;</a>                
        </div>`}
         
        ${isFillBlankType ? "" : 
        `<div style="margin-top:145% ;margin-left:190%">
            <a class="list__check-btn"><i class="fas fa-clipboard-check"></i></a>`
        }
    </div>                       
    </li>`);
}

$(document).ready(function() {
    // Add a new item to the list by clicking "Add" button
    $('.create-question').on('click', function(event){
        // (prevents form submit button unwanted default action)
        event.preventDefault();

        const currentOption = localStorage.getItem('questionTypeSelected');
        if (currentOption == "Verdadero/Falso" || currentOption == "Llena los espacios" || currentOption == "Subir un link") return alert("No puedes agregar más opciones a una pregunta de este tipo.");

        addItem();
    });

    // Clicking an item's check button:
    $('.list').on('click', '.list__check-btn', function(event){
        const currentOption = localStorage.getItem('questionTypeSelected')
        if (currentOption != "Eleccion multiple") {
            $('.list').children().each(function(index, elem) {
                $(`#${elem.id}`).css("border", "1px solid #000");
            })
        }
        
        $(this).parent().parent().parent().css("border", "5px double rgb(0, 255, 0)");
    });


    // Clicking an item's delete button:
    $('.list').on('click', '.list__delete-btn', function(){
        let deletedId = $(this).parent().parent().parent().attr("id").split("-")[2];
        let isTheFirstOne = deletedId == 0;
        $("#total-list ul").children().each(function(index) {
            $(`#list-item-${index + 1}`).attr("id", "list-item-"+(isTheFirstOne ? index : (index + 1)));
            $(`#submission-line-1-${index + 1}`).attr("id", "submission-line-1-"+(isTheFirstOne ? index : (index + 1)));
            $(`#submission-line-2-${index + 1}`).attr("id", "submission-line-2-"+(isTheFirstOne ? index : (index + 1)));
        });

        // removes that item from the list
        $(this).parent().parent().parent().fadeOut(300, function(){
            $(this).remove();
        });
    });

    $('.list').sortable({
        distance: 2,
        revert: 300,
        cancel: ".list__item--checked"
    });

});