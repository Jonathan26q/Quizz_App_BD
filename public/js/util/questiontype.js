$(document).ready(function() {
    instanceSelect();
});

function instanceSelect() {
    var countOption = $('.old-select option').size();
    
    function openSelect(){
        var heightSelect = $('.new-select').height();
        var j=1;
        $('.new-select .new-option').each(function(){
            $(this).addClass('reveal');
            $(this).css({
                'box-shadow':'0 1px 1px rgba(0,0,0,0.1)',
                'left':'0',
                'right':'0',
                'top': j*(heightSelect+1)+'px'
            });
            j++;
        });
    }
    
    function closeSelect(){
        var i=0;
        $('.new-select .new-option').each(function(){
            $(this).removeClass('reveal');
            if(i<countOption-3){
                $(this).css('top',0);
                $(this).css('box-shadow','none');
            }
            else if(i===countOption-3){
                $(this).css('top','3px');
            }
            else if(i===countOption-2){
                $(this).css({
                    'top':'7px',
                    'left':'2px',
                    'right':'2px'
                });
            }
            else if(i===countOption-1){
                $(this).css({
                    'top':'11px',
                    'left':'4px',
                    'right':'4px'
                });
            }
            i++;
        });
    }
    
    // Initialisation
    if($('.old-select option[selected]').size() === 1){
        $('.selection p span').html($('.old-select option[selected]').html());
    }
    else{
        $('.selection p span').html($('.old-select option:first-child').html());
    }
    
    $('.old-select option').each(function(){
        newValue = $(this).val();
        newHTML = $(this).html();
        if (newValue != "default") 
            $('.new-select').append(`<div class="new-option" data-value='${newValue}'><p>${newHTML}</p></div>`);
        else {
            localStorage.removeItem("classroomCreateSurvey");
            localStorage.removeItem("questionTypeSelected");
        }
    });
    
    var reverseIndex = countOption;
    $('.new-select .new-option').each(function(){
        $(this).css('z-index',reverseIndex);
        reverseIndex = reverseIndex-1;        
    });
    
    closeSelect();
    
    // Ouverture / Fermeture
    $('.selection').click(function(){
        $(this).toggleClass('open');
        if($(this).hasClass('open')===true){openSelect();}
        else{closeSelect();}
    });
    
    // Selection 
    $('.new-option').click(function(){
        var newValue = $(this).data('value');
        
        $('.selection p span').html($(this).find('p').html());
        $('.selection').click();

        $('.old-select option[selected]').removeAttr('selected');
        $('.old-select option[value="'+newValue+'"]').attr('selected','');
        
        if (newValue.includes("*")) {
            localStorage.setItem("classroomCreateSurvey", newValue.substring(0, newValue.length - 1));
        } else {
            if (newValue === 'default' || !newValue) return;

            clearTotalList(newValue);
            localStorage.setItem("questionTypeSelected", newValue);
            
            if (newValue === "Verdadero/Falso") {
                addItem("Falso");
                addItem("Verdadero");
            }

            if (newValue === "Llena los espacios") { 
                addItem("Llena los espacios");

                const inputQuestionArea = document.querySelector(".input-question-area");
                inputQuestionArea.style.width = "100%";

                // cambiar height de submission-line__input
                const input = document.querySelector(".submission-line__input");
                input.style.height = "-webkit-fill-available";
            }
        }
    });
}

function clearTotalList() {
    const totalListElement = document.querySelector('#total-list ul');
    totalListElement.innerHTML = '';
}