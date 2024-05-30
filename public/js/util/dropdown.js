$(document).ready(function() {
    instanceDropdown();
});

function instanceDropdown() {
    /*Dropdown Menu*/
    $('.dropdown').click(function () {
        if (!e) var e = window.event;
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
        $(this).attr('tabindex', 1).focus();
        $(this).toggleClass('active');
        $(this).find('.dropdown-menu').slideToggle(300);
    });
    $('.dropdown').focusout(function () {
        $(this).removeClass('active');
        $(this).find('.dropdown-menu').slideUp(300);
    });
    $('.dropdown .dropdown-menu li').click(function () {
        $(this).parents('.dropdown').find('span').text($(this).text());
        $(this).parents('.dropdown').find('input').attr('value', $(this).attr('id'));
    });
    /*End Dropdown Menu*/

    $('.dropdown-menu li').click(function () {
        //^
        let inputVal = $(this).parents('.dropdown').find('input').val();
        if ($(this).context.id.includes("^")) {
            localStorage.setItem("classroomBankSelectionViewInput", inputVal.slice(0, -1));
        } else {
            localStorage.setItem("classroomSelectionViewInput", inputVal);
            window.location.assign("../html/surveys.html");
        }
    });
}