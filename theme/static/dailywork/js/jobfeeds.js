function ajax(type,uri,data,data_type,on_done,on_fail,on_404) {
    $.ajax({
            type: type,
            url : uri,
            data: data,
            dataType:data_type,
            statusCode: {
                404: on_404
            }
        })
        .done(on_done)
        .fail(on_fail)
}
var ms_skills;
var ms_state;
var all_skills = [];
var my_skills = [];
var last_id = 0;
var active_apply_job = 0;
var use_my_location = false;
var triger_my_location = false;
var radius_zip = "";
var skills = "";
var states = "";
var state_my_location = "";
var country_my_location = "";
var auto_load;
var active_job_employer = 0;
function logout() {
     $("#logout-icon").html('<i class="fa fa-spin fa-spinner"></i>&nbsp;Logout');    
     ajax("POST","/freelancer/logout/",{'csrfmiddlewaretoken':$("input[name=csrfmiddlewaretoken]").val()},"HTML",function(response){
            window.location.assign("/");    
        },function(){},function(){});
}
function modal_show(modal_name) {
      $('.modal').modal('hide');
      $(modal_name).modal('show');
}
function init_skills_search() {
     $('#skill-suggest').magicSuggest({
                value: [],
                useZebraStyle: true,
                allowFreeEntries: false,
                data: [],
                maxSelection: 100,
                sortOrder: 'name',
                maxDropHeight: 150,
                name: 'produk',
                placeholder: 'Type Skills Required Here',
                toggleOnClick: true,

            });
            ms_skills = $('#skill-suggest').magicSuggest({});
}
function init_sugest_states(){
     $('#states-suggest').magicSuggest({
                value: [],
                useZebraStyle: true,
                allowFreeEntries: false,
                data: [],
                maxSelection: 10,
                sortOrder: 'name',
                maxDropHeight: 150,
                name: 'produk',
                placeholder: 'Type Your State',
                toggleOnClick: true,

            });
            ms_state = $('#states-suggest').magicSuggest({});
}
function load_states() {
    ajax("POST","/states/load/",{'csrfmiddlewaretoken':$("input[name=csrfmiddlewaretoken]").val(),'country':$("#slct-countries-search").val()},"JSON",function(response){
        var states_list = [];
        var is_state_exists = false;
            for(i = 0 ; i < response.length;i++){
                 states_list.push({id:response[i].pk,name:response[i].fields.name});
                  if (response[i].pk== $("#properties_state").val()) {
                    is_state_exists =true;
                 }
            }
            ms_state.clear();
            ms_state.setData(states_list);
            my_state = [];
            if ($("#properties_state").val() != 60 && is_state_exists) {
                my_state.push(($("#properties_state").val()));   
            }
            ms_state.setValue(my_state);
            load_skill_list();
        },function(){},function(){});
}
function load_skill_list(){
    ajax("POST","/skills/load/",{'csrfmiddlewaretoken':$("input[name=csrfmiddlewaretoken]").val()},"JSON",function(response){
            for(i = 0 ; i < response.length;i++){
                all_skills.push({id:response[i].pk,name:response[i].fields.name});
            }
            ms_skills.setData(all_skills);
            var skill_sets = $("#skill-set").find('span');
            my_skills = [];
            for(i = 0 ; i < skill_sets.length;i++){
                my_skills.push({id:skill_sets.eq(i).attr("id"),name:skill_sets.eq(i).html()});
            }
            ms_skills.setValue(my_skills);
            load_feeds();
            auto_load = setInterval(function(){
                if (triger_my_location) {
                    update_feeds_my_location();
                }else{
                    update_feeds();
                }
    
            }, 15000);
        },function(){},function(){});
}
function get_zip_by_radius(radius_par,zip_par){
   $("#job-list").html('<div style="color:#00A69A;text-align:center"><i class="fa fa-spin fa-spinner fa-5x"></i><br><font size=4><b>Loading Jobs Feed</b></font></div>');
   ajax("GET","https://www.zipcodeapi.com/rest/js-mHrpCjK46iZO9PCmnIe09RxzDBjG5oir6KQI3BMaTLY2AApXjDYtvw288lPdK8FQ/radius.json/"+zip_par+"/"+radius_par+"/mile",{},"JSON",function(response){
        radius_zip="";
            for(i = 0 ; i < response.zip_codes.length;i++){
                radius_zip+=response.zip_codes[i].zip_code+",";
            }
             radius_zip = radius_zip.substring(0, radius_zip.length - 1);
             do_load_feeds();
        },function(){},function(){});
}
function load_feeds(){
     clearInterval(auto_load);
    skills = "";
    radius_zip = ""
    var temp_skills = ms_skills.getSelection();
    if (temp_skills.length >0) {
        for(i = 0; i < temp_skills.length;i++){
            skills += temp_skills[i].id+",";
        }
        skills = skills.substring(0, skills.length - 1);
    }
    states="";
    var temp_states = ms_state.getSelection();
    if (temp_states.length >0) {
        for(i = 0; i < temp_states.length;i++){
            states += temp_states[i].id+",";
        }
        states = states.substring(0, states.length - 1);
    }
    triger_my_location = use_my_location;
    if (use_my_location) {
        $("#jobs-list").html('<div style="color:#00A69A;text-align:center"><i class="fa fa-spin fa-spinner fa-5x"></i><br><font size=4><b>Loading Jobs</b></font></div>');
        navigator.geolocation.getCurrentPosition(alocate_position,on_error);
    }else{
        $("#jobs-list").html('<div style="color:#00A69A;text-align:center"><i class="fa fa-spin fa-spinner fa-5x"></i><br><font size=4><b>Loading Jobs</b></font></div>');
        if ($("#radius-jobs-feed").val().trim() !="" && $("#radius-jobs-feed").val().trim() !="0" && $("#zip-jobs-feed").val().trim() !="") {
            get_zip_by_radius($("#radius-jobs-feed").val().trim(),$("#zip-jobs-feed").val().trim());
        }else if($("#zip-jobs-feed").val().trim() !=""){
            radius_zip = $("#zip-jobs-feed").val().trim();
            do_load_feeds();
        }else{
            do_load_feeds();
        }    
    }
     auto_load = setInterval(function(){
                if (triger_my_location) {
                    update_feeds_my_location();
                }else{
                    update_feeds();
                }
    
            }, 15000);
}
function get_zip_by_radius_my_location(radius,zip){
   $("#jobs-list").html('<div style="color:#00A69A;text-align:center"><i class="fa fa-spin fa-spinner fa-5x"></i><br><font size=4><b>Loading Jobs</b></font></div>');
   ajax("GET","https://www.zipcodeapi.com/rest/js-mHrpCjK46iZO9PCmnIe09RxzDBjG5oir6KQI3BMaTLY2AApXjDYtvw288lPdK8FQ/radius.json/"+zip+"/"+radius+"/mile",{},"JSON",function(response){
        radius_zip="";
            for(i = 0 ; i < response.zip_codes.length;i++){
                radius_zip+=response.zip_codes[i].zip_code+",";
            }
             radius_zip = radius_zip.substring(0, radius_zip.length - 1);
             do_load_feeds_with_location();
        },function(){},function(){
                radius_zip = zip;
                do_load_feeds_with_location();
            });
}
function on_error() {
    //code
}
function alocate_position(position){
    //ajax("GET","http://maps.googleapis.com/maps/api/geocode/json?latlng=1.4996449,124.8657826&sensor=true",{},"JSON",function(response){
   ajax("GET","http://maps.googleapis.com/maps/api/geocode/json?latlng="+position.coords.latitude +","+position.coords.longitude+"&sensor=true",{},"JSON",function(response){
        var result = $.grep(response.results[0].address_components, function(e){ return e.types == "postal_code"; })[0]
        if (result != undefined) {
            var zip_location = result.long_name;
            state_my_location = "";
            country_my_location = "";
            if ($("#radius-jobs-feed").val().trim() !="") {
                //get_zip_by_radius_my_location($("#radius-jobs-feed").val().trim(),zip_location);
                get_zip_by_radius_my_location($("#radius-jobs-feed").val().trim(),'36340');
            }else{
                radius_zip = zip_location;
                do_load_feeds_with_location();
            }
        }else{
            radius_zip = "";
            $("#error-location-not-found").fadeIn(1000);
            state_my_location = $.grep(response.results[0].address_components, function(e){ return e.types[0] == "administrative_area_level_1"; })[0].short_name;
            country_my_location = $.grep(response.results[0].address_components, function(e){ return e.types[0] == "country"; })[0].short_name;
            do_load_feeds_with_location();
        }
        
    },function(){},function(){});
}
function do_load_feeds_with_location(){
    $("#jobs-list").html('<div style="color:#00A69A;text-align:center"><i class="fa fa-spin fa-spinner fa-5x"></i><br><font size=4><b>Loading Jobs</b></font></div>');
    ajax("POST","/freelancer/jobs/feed/my-location/",{'csrfmiddlewaretoken':$("input[name=csrfmiddlewaretoken]").val(),
                                          'key_string':$("#keyword-jobs-search").val(),
                                          'skills':skills,
                                          'states':state_my_location,
                                          'country':country_my_location,
                                          "zip_radius":radius_zip
         
         },"HTML",function(response){
           if (response =="{|}False{|}False") {
                    $("#jobs-list").html('<div style="color:#00A69A;text-align:center"><br><font size=4><b>You Have not Posted a Job Yet</b></font></div>');
               }else{
                    var response_parse = response.split("{|}");
                    var job_list = response_parse[0].split("<br>");
                    var html_tag = "";
                    var detail_job = [];
                    var skill_list = [];
                    last_id = parseInt(job_list[0].split("||")[0].trim());
                    console.log(last_id);
                    for(i = 0 ; i < job_list.length-1;i++){
                        skill_list = [];
                        detail_job = job_list[i].split("||");
                        detail_job[0] = detail_job[0].trim();
                        html_tag +='<article class="resume-item"><a href="#" onclick="apply_job('+detail_job[0]+','+detail_job[5].trim()+','+detail_job[8]+')"><div class="resume-year"><small id="btn-apply-'+detail_job[0]+'" ><i class="fa fa-paperclip"></i>&nbsp;Apply Job</small></div></a><div class="resume-btn"><a href="#my-job-'+detail_job[0]+'" data-toggle="collapse" data-parent="#experience"></a></div><div class="panel"><div class="panel-heading"><div class="panel-title"><h4 class="resume-title" id="resume-title-'+detail_job[0]+'">'+detail_job[1]+'</h4><p class="text-secondary"><font size=2><a href="#" class="timeago" title="'+detail_job[2]+'"></a></font><br></p><span style="margin-left: 90%;">';
                        html_tag +=' </span></div></div>';
                        html_tag +='<div id="my-job-'+detail_job[0]+'" class="panel-collapse collapse in"><div class="panel-body text-grey">';
                        html_tag +='<div id="detail-location" style="color:#00A69A;"><i class="fa fa-map-marker"></i>';
                        var location_list = detail_job[6].split("{-|-}");
                        for(j = 0 ; j < location_list.length-1;j++){
                            if (j == location_list-2) {
                                html_tag+=" "+location_list[j]+",";
                            }else{
                                html_tag+=" "+location_list[j]+".";
                            }
                        }
                        html_tag +='&nbsp;'+detail_job[7]+'</div>Budget : $'+detail_job[5].trim()+'<br>';
                        if ( detail_job[3].trim() !="") {
                            skill_list = detail_job[3].split("{-|-}");
                            skill_list.pop();
                        }
                        for (j = 0 ; j < skill_list.length;j++) {
                            html_tag+='<span class="label label-info">'+skill_list[j]+'</span>\n';
                        }
                        html_tag +='<br><p style="width:88%">'+detail_job[4]+'</p></div></div></div></article>';
                    }
                    $("#jobs-list").html(html_tag);
               }
        },function(){},function(){});
}
function update_feeds_my_location(){
    var temp_skills = ms_skills.getSelection();
    if (temp_skills.length >0) {
        for(i = 0; i < temp_skills.length;i++){
            skills += temp_skills[i].id+",";
        }
        skills = skills.substring(0, skills.length - 1);
    }
    var states = "";
    var temp_states = ms_state.getSelection();
    if (temp_states.length >0) {
        for(i = 0; i < temp_states.length;i++){
            states += temp_states[i].id+",";
        }
        states = states.substring(0, states.length - 1);
    }
    
    ajax("POST","/freelancer/jobs/feed/my-location/",{'csrfmiddlewaretoken':$("input[name=csrfmiddlewaretoken]").val(),
                                          'key_string':$("#keyword-jobs-search").val(),
                                          'skills':skills,
                                          'states':state_my_location,
                                          'country':country_my_location,
                                          "zip_radius":radius_zip
         
         },"HTML",function(response){
           if (response=="{|}False{|}False") {
                    $("#jobs-list").html('<div style="color:#00A69A;text-align:center"><br><font size=4><b>No Jobs Found</b></font></div>');
               }else{
                    var response_parse = response.split("{|}");
                    var job_list = response_parse[0].split("<br>");
                    var html_tag = "";
                    var detail_job = [];
                    var skill_list = [];
                    var temp_last = last_id;
                    console.log(last_id);
                    for(i = 0 ; i < job_list.length-1;i++){
                        skill_list = [];
                        detail_job = job_list[i].split("||");
                        detail_job[0] = detail_job[0].trim();
                        console.log(detail_job[0].trim());
                        //console.log(last_id);
                        if (parseInt(detail_job[0]) > last_id) {
                            if (i==0) {
                                temp_last = parseInt(detail_job[0]);
                            }
                            html_tag +='<article class="resume-item"><a href="#" onclick="apply_job('+detail_job[0]+','+detail_job[5].trim()+','+detail_job[8]+')"><div class="resume-year"><small id="btn-apply-'+detail_job[0]+'"><i class="fa fa-paperclip"></i>&nbsp;Apply Job</small></div></a><div class="resume-btn"><a href="#my-job-'+detail_job[0]+'" data-toggle="collapse" data-parent="#experience"></a></div><div class="panel"><div class="panel-heading"><div class="panel-title"><h4 class="resume-title" id="resume-title-'+detail_job[0]+'">'+detail_job[1]+'</h4><p class="text-secondary"><font size=2><a href="#" class="timeago" title="'+detail_job[2]+'"></a></font><br></p><span style="margin-left: 90%;">';
                            html_tag +=' </span></div></div>';
                            html_tag +='<div id="my-job-'+detail_job[0]+'" class="panel-collapse collapse in"><div class="panel-body text-grey">';
                            html_tag +='<div id="detail-location" style="color:#00A69A;"><i class="fa fa-map-marker"></i>';
                            var location_list = detail_job[6].split("{-|-}");
                            for(j = 0 ; j < location_list.length-1;j++){
                                if (j == location_list-2) {
                                    html_tag+=" "+location_list[j]+",";
                                }else{
                                    html_tag+=" "+location_list[j]+".";
                                }
                            }
                            html_tag +='&nbsp;'+detail_job[7]+'</div>Budget : $'+detail_job[5].trim()+'<br>';
                            if ( detail_job[3].trim() !="") {
                                skill_list = detail_job[3].split("{-|-}");
                                skill_list.pop();
                            }
                            for (j = 0 ; j < skill_list.length;j++) {
                                html_tag+='<span class="label label-info">'+skill_list[j]+'</span>\n';
                            }
                            html_tag +='<br><p style="width:88%">'+detail_job[4]+'</p></div></div></div></article>';
                        }else{
                            break;
                        }
                        
                    }
                    last_id = temp_last;
                    console.log(html_tag);
                    $(html_tag).prependTo('#jobs-list').hide().slideDown();
               }
        },function(){},function(){});
}
function do_load_feeds(){
    $("#jobs-list").html('<div style="color:#00A69A;text-align:center"><i class="fa fa-spin fa-spinner fa-5x"></i><br><font size=4><b>Loading Jobs</b></font></div>');
    ajax("POST","/freelancer/jobs/feed/",{'csrfmiddlewaretoken':$("input[name=csrfmiddlewaretoken]").val(),
                                          'key_string':$("#keyword-jobs-search").val(),
                                          'skills':skills,
                                          'states':states,
                                          'city':$("#city-jobs-search").val(),
                                          'country':$("#slct-countries-search").val(),
                                          "zip_radius":radius_zip
         
         },"HTML",function(response){
           if (response =="{|}False{|}False") {
                    $("#jobs-list").html('<div style="color:#00A69A;text-align:center"><br><font size=4><b>You Have not Posted a Job Yet</b></font></div>');
               }else{
                    var response_parse = response.split("{|}");
                    var job_list = response_parse[0].split("<br>");
                    var html_tag = "";
                    var detail_job = [];
                    var skill_list = [];
                    last_id = parseInt(job_list[0].split("||")[0].trim());
                    console.log(last_id);
                    for(i = 0 ; i < job_list.length-1;i++){
                        skill_list = [];
                        detail_job = job_list[i].split("||");
                        detail_job[0] = detail_job[0].trim();
                        html_tag +='<div class="row"><a href="#" onclick="apply_job('+detail_job[0]+','+detail_job[5].trim()+
                            ','+detail_job[8]+')"><div class="resume-year"><small id="btn-apply-'+detail_job[0]+'" ><i class="fa fa-paperclip"></i>&nbsp;Apply Job</small></div></a>' +
                            '<div class="resume-btn"><a href="#my-job-'+detail_job[0]+'" data-toggle="collapse" data-parent="#experience"></a></div>' +
                            '<h4 class="resume-title" id="resume-title-'+detail_job[0]+'">'+detail_job[1]+'</h4>' +
                            '<p class="text-secondary"><font size=2><a href="#" class="timeago" title="'+detail_job[2]+'"></a></font><br></p>' +
                            '';
                        html_tag +=' ';
                        html_tag +='<div id="my-job-'+detail_job[0]+'" class="panel-collapse collapse in"><div >';
                        html_tag +='<div id="detail-location" style="color:#00A69A;"><i class="fa fa-map-marker"></i>';
                        var location_list = detail_job[6].split("{-|-}");
                        for(j = 0 ; j < location_list.length-1;j++){
                            if (j == location_list-2) {
                                html_tag+=" "+location_list[j]+",";
                            }else{
                                html_tag+=" "+location_list[j]+".";
                            }
                        }
                        html_tag +='&nbsp;'+detail_job[7]+'</div>' +

                            '<small class="block styleSecondColor fsize17">' +
                            'Budget : $'+detail_job[5].trim()+'</small>';
                        if ( detail_job[3].trim() !="") {
                            skill_list = detail_job[3].split("{-|-}");
                            skill_list.pop();
                        }
                        for (j = 0 ; j < skill_list.length;j++) {
                            html_tag+='<span class="label label-info fsize12 pull-right">'+skill_list[j]+'</span>\n' +
                                ''
                                ;
                        }
                        html_tag +='<br><p style="width:88%">'+detail_job[4]+'</p></div></div></div></div><hr class="half-margins">';
                    }
                    $("#jobs-list").html(html_tag);
               }
        },function(){},function(){});
}
function update_feeds(){
    var temp_skills = ms_skills.getSelection();
    if (temp_skills.length >0) {
        for(i = 0; i < temp_skills.length;i++){
            skills += temp_skills[i].id+",";
        }
        skills = skills.substring(0, skills.length - 1);
    }
    var states = "";
    var temp_states = ms_state.getSelection();
    if (temp_states.length >0) {
        for(i = 0; i < temp_states.length;i++){
            states += temp_states[i].id+",";
        }
        states = states.substring(0, states.length - 1);
    }
    
    ajax("POST","/freelancer/jobs/feed/",{'csrfmiddlewaretoken':$("input[name=csrfmiddlewaretoken]").val(),
                                          'key_string':$("#keyword-jobs-search").val(),
                                          'skills':skills,
                                          'states':states,
                                          'city':$("#city-jobs-search").val(),
                                          'country':$("#slct-countries-search").val(),
                                          "zip_radius":radius_zip
         
         },"HTML",function(response){
           if (response=="{|}False{|}False") {
                    $("#jobs-list").html('<div style="color:#00A69A;text-align:center"><br><font size=4><b>No Jobs Found</b></font></div>');
               }else{
                    var response_parse = response.split("{|}");
                    var job_list = response_parse[0].split("<br>");
                    var html_tag = "";
                    var detail_job = [];
                    var skill_list = [];
                    var temp_last = last_id;
                    console.log(last_id);
                    for(i = 0 ; i < job_list.length-1;i++){
                        skill_list = [];
                        detail_job = job_list[i].split("||");
                        detail_job[0] = detail_job[0].trim();
                        console.log(detail_job[0].trim());
                        //console.log(last_id);
                        if (parseInt(detail_job[0]) > last_id) {
                            if (i==0) {
                                temp_last = parseInt(detail_job[0]);
                            }
                            html_tag +='<article class="resume-item"><a href="#" onclick="apply_job('+detail_job[0]+','+detail_job[5].trim()+','+detail_job[8]+')"><div class="resume-year"><small id="btn-apply-'+detail_job[0]+'"><i class="fa fa-paperclip"></i>&nbsp;Apply Job</small></div></a><div class="resume-btn"><a href="#my-job-'+detail_job[0]+'" data-toggle="collapse" data-parent="#experience"></a></div><div class="panel"><div class="panel-heading"><div class="panel-title"><h4 class="resume-title" id="resume-title-'+detail_job[0]+'">'+detail_job[1]+'</h4><p class="text-secondary"><font size=2><a href="#" class="timeago" title="'+detail_job[2]+'"></a></font><br></p><span style="margin-left: 90%;">';
                            html_tag +=' </span></div></div>';
                            html_tag +='<div id="my-job-'+detail_job[0]+'" class="panel-collapse collapse in"><div class="panel-body text-grey">';
                            html_tag +='<div id="detail-location" style="color:#00A69A;"><i class="fa fa-map-marker"></i>';
                            var location_list = detail_job[6].split("{-|-}");
                            for(j = 0 ; j < location_list.length-1;j++){
                                if (j == location_list-2) {
                                    html_tag+=" "+location_list[j]+",";
                                }else{
                                    html_tag+=" "+location_list[j]+".";
                                }
                            }
                            html_tag +='&nbsp;'+detail_job[7]+'</div>Budget : $'+detail_job[5].trim()+'<br>';
                            if ( detail_job[3].trim() !="") {
                                skill_list = detail_job[3].split("{-|-}");
                                skill_list.pop();
                            }
                            for (j = 0 ; j < skill_list.length;j++) {
                                html_tag+='<span class="label label-info">'+skill_list[j]+'</span>\n';
                            }
                            html_tag +='<br><p style="width:88%">'+detail_job[4]+'</p></div></div></div></article>';
                        }else{
                            break;
                        }
                        
                    }
                    last_id = temp_last;
                    $(html_tag).prependTo('#jobs-list').hide().slideDown();
               }
        },function(){},function(){});
}
function apply_job(job_id,bid,employer_id){
    active_apply_job = job_id;
    active_job_employer = employer_id;
    $("#btn-apply-"+job_id).html('<i class="fa fa-spin fa-spinner"></i>');
    ajax("POST","/freelancer/job/is-bided/",{'csrfmiddlewaretoken':$("input[name=csrfmiddlewaretoken]").val(),
                                          'job_id':active_apply_job,
          },"HTML",function(response){
            $("#btn-apply-"+job_id).html('<i class="fa fa-paperclip"></i>&nbsp;Apply Job');
            if (response == "0") {
                $("#apply-title").html("Apply Job -"+$("#resume-title-"+job_id).html());
                $("#rate-apply").val(bid);
                modal_show('#mdl_apply_job');
            }else if (response == "2") {
                $("#bided_message").html("Your Monthly Perioded is Expired Please Go to Profile and review your Membership expire date");
                $("#apply-title-bided").html("Apply Job -"+$("#resume-title-"+job_id).html());
                modal_show('#modal_already_bid');
                active_apply_job = 0;
            }
            else if(response =="1"){
                $("#bided_message").html("You Already Apply This Job");
                $("#apply-title-bided").html("Apply Job -"+$("#resume-title-"+job_id).html());
                modal_show('#modal_already_bid');
                active_apply_job = 0;
            }else{
                window.location.assign("/");
            }
        },function(){},function(){});
}
function reset_bid_form(){
    $("#rate-apply").val('');
    $("#msg-apply").val('');
}
function do_place_bid() {
     $("#lbl-place-bid").html('<i class="fa fa-spin fa-spinner"></i>');    
     ajax("POST","/freelancer/jobs/bid/",{'csrfmiddlewaretoken':$("input[name=csrfmiddlewaretoken]").val(),
                                          'job_id':active_apply_job,
                                          'rate':$("#rate-apply").val(),
                                          'message': $("#msg-apply").val()
          },"HTML",function(response){
            if (response == "1") {
                reset_bid_form();
                active_apply_job = 0;
                $("#lbl-place-bid").html('<i class="fa fa-floppy-o"></i>&nbsp;Apply This Job');
                $('#mdl_apply_job').modal('hide');
            }else{
                $("#lbl-place-bid").html('Oops Something went wrong click to try again');    
            }
        },function(){
                $("#lbl-place-bid").html('Oops Something went wrong click to try again');    
            },function(){},function(){});
     socket.emit('notif',"E-"+active_job_employer);
}
function place_bid(){
    if ($("#rate-apply").val() == "") {
        $(".bid-error").hide();
        $("#bid-apply-error").html('<font style="color: red;">Budget is Empty</font>');
        $("#bid-apply-error").fadeIn(1000);
        $("#rate-apply").focus();   
    }else if ($("#rate-apply").val() <1) {
        $(".bid-error").hide();
        $("#bid-apply-error").html('<font style="color: red;">Budget must be at least $1</font>');
        $("#bid-apply-error").fadeIn(1000);
        $("#rate-apply").focus();
    }else{
        do_place_bid();
    }
}
$( document ).ready(function() {
$("#zip-jobs-feed").val($("#properties_zip").val())
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    $("body").css('overflow-y','auto');
}else{
    $("body").css('overflow-y','hidden');
}
$("#search-use-my-location").bootstrapSwitch();
    $('input[id="search-use-my-location"]').bootstrapSwitch('state', false, false);
    $('#search-use-my-location').on('switchChange.bootstrapSwitch', function(event, state) {
        use_my_location = state;
        if (state) {
            $("#location-search").show().slideUp();
        }else{
            $("#location-search").hide().slideDown();
        }
    });
init_skills_search();
init_sugest_states();
load_states();
});
function isNumberKey(evt){
    var charCode = (evt.which) ? evt.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}
function enter_key_search(e){
     if(e.keyCode == 13){
        load_feeds()
     }
}