/**
*/
$('.birthday').datepicker({
  dateFormat: 'dd-mm-yy'
});

function confirmDelete(){
  if(confirm('Bạn chắc chắn muốn xóa?')){
    return true;
  }
  return false;
}
