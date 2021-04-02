const storage = require('electron-json-storage')

let get_cur_time = function () {
    if (vPlayer) {
        return vPlayer.currentTime()
    } else {
        return 0
    }
}

let ann_state = "create"
let cur_video_name = ""
let ann_cur_id = 0
let ann_now = {"start": 0, "end": 0}
let actino_now = "acting"
let duration = 0
let remove_now = []

let save_timer = null
let error_timer = null


function reset_ann() {
    ann_state = "create"
    ann_now = {"start": 0, "end": 0}
}

function set_ann_bar(start, end, cur_id, color='#4e95ff') {
    bar_width = $('.vjs-load-progress').width()
    bar_start = bar_width * start / duration
    bar_end = bar_width * end / duration
    // console.log("duration: "+ duration.toString())
    // console.log("bar_width: "+ bar_width.toString())
    // console.log("bar_start: "+ bar_start.toString())
    // console.log("start: "+ start.toString())
    $('#ann_bar_'+cur_id).css({
        'left': bar_start,
        'width': bar_end - bar_start,
        'top': 20 + 7 * cur_id,
        'display': 'block',
        'background-color': color
    })
}

function save_json() {
    let ann_save = {"video": []}
    ann_all["video"].forEach((video_i, idx) => {
        ann_save["video"].push({"action": [], "name": video_i["name"], "duration": video_i["duration"]})
        video_i["action"].forEach((action_i) => {
            if (action_i["end"] > 0) {
                ann_save["video"][idx]["action"].push(action_i)
            }
        })
    })
    if (ann_save["video"].length > 0 && cur_video_name !== "") {
        storage.set('annotations.json', ann_save, function (error) {
            if (error) throw error
            save_signal()
            console.log("saved!!")
        });
    }
}

function save_color_change() {
    document.getElementById("save_btn").style.background = '#fcf3c1'
}

function error_color_change() {
    document.getElementById("error_btn").style.background = '#69aece'
}

// interval save
const save_json_interval = () => {
    save_json()
    console.log("save interval")
}
setInterval(save_json_interval, 20000)

document.getElementById('text_action_category').addEventListener('input', updateValue);

function updateValue(e) {
  action_now = e.target.value;
}

// save signal light
function save_signal() {
    if (save_timer !== null) {
        clearTimeout(save_timer)
        save_timer = null
    }
    document.getElementById("save_btn").style.background = 'green'
    save_timer = setTimeout(save_color_change , 200);
}

// error signal light
function error_signal() {
    if (error_timer !== null) {
        clearTimeout(error_timer)
        error_timer = null
    }
    if (ann_state !== "create") {
        document.getElementById("error_btn").style.background = 'red'
    } else {
        document.getElementById("error_btn").style.background = 'green'
    }
    error_timer = setTimeout(error_color_change , 150);
}

// select annotation
function select_annotation(elemnt) {
    error_signal()
    if (ann_state === "create") {
        ann_cur_id = parseInt(elemnt.id.split("_")[2])
        ann_now = ann_all["video"][cur_video_id]["action"][ann_cur_id]
        actino_now = ann_all["video"][cur_video_id]["action"][ann_cur_id]["category"]
        document.getElementById("text_action_category").value = actino_now
        $('#ann_bar_'+ann_cur_id).css({
            'background-color': 'red'
        });
        ann_state = "modify"
    }
}

// remove annotation
function remove_annotation(elemnt) {
    error_signal()
    if (ann_state === "create") {
        selected_id = parseInt(elemnt.id.split("_")[2])
        let remove_idx = remove_now.findIndex(element => element == selected_id)
        if (remove_idx < 0) {
            remove_now.push(cur_video_id)
        }
        $("#ann_"+selected_id).remove()
        $("#ann_bar_"+selected_id).remove()
        ann_all["video"][cur_video_id]["action"][selected_id]["end"] = -1
    }
}

function add_ann_tool(idx) {
    $('#ann_'+idx).append('<a href="#" onclick="select_annotation(this)" style="margin-left: 70px" id="ann_item_' + idx + '">' + "✂" + '</a>')
    $('#ann_'+idx).append('<a href="#" onclick="remove_annotation(this)" style="margin-left: 15px" id="ann_item_' + idx + '">' + "⤺" + '</a>')    
}

// set start
Mousetrap.bind('q', () => {
    if (duration === 0) {
        set_duration()
        // console.log("duration :"+duration.toString())
    }
    if (ann_state === "modify" || ann_state === "create") {
        let currentTime = get_cur_time()
        let slider_bar = $('.vjs-play-progress.vjs-slider-bar')
        // while create a new action annotation
        if (ann_state === "create") {
            ann_now["start"] = currentTime
            // create ann text display
            let li_t = document.createElement("li")
            li_t.id = "ann_" + ann_cur_id
            li_t.className = "ann_text"
            console.log($("#text_action_category").val())
            actino_now = $("#text_action_category").val()
            $('#ann_action').append(li_t)
            $('#ann_'+ann_cur_id).append(actino_now + " : " + currentTime.toFixed(3) + ", -")
            add_ann_tool(ann_cur_id)
            ann_state = "modify"
            // create ann bar
            slider_bar.append('<div class="vjs-ann-bar" onclick="select_annotation(this)" id="ann_bar_'+ ann_cur_id + '"></div>')
            set_ann_bar(ann_now["start"], ann_now["start"]+0.15, ann_cur_id, color='red')
        } else {
            // while motify action start
            if ((ann_now["end"] === 0 && currentTime > 0) || (currentTime < ann_now["end"])) {
                ann_now["start"] = currentTime
                if (ann_now["end"] === 0) {
                    document.getElementById("ann_"+ann_cur_id).textContent = actino_now + " : " + ann_now["start"].toFixed(3) + ", -"
                    add_ann_tool(ann_cur_id)
                    set_ann_bar(ann_now["start"], ann_now["start"]+0.15, ann_cur_id, color='red')
                } else {
                    document.getElementById("ann_"+ann_cur_id).textContent = actino_now + " : " + ann_now["start"].toFixed(3) + ", " + ann_now["end"].toFixed(3)
                    add_ann_tool(ann_cur_id)
                    set_ann_bar(ann_now["start"], ann_now["end"], ann_cur_id, color=color='red')
                }
            }
        }
    }
})

// set end
Mousetrap.bind('e', () => {
    if (duration === 0) {
        set_duration()
    }
    if (ann_state === "modify") {
        let currentTime = get_cur_time()
        if (currentTime > ann_now["start"]) {
            ann_now["end"] = currentTime
            document.getElementById("ann_"+ann_cur_id).textContent = actino_now + " : " + ann_now["start"].toFixed(3) + ", " + ann_now["end"].toFixed(3)
            add_ann_tool(ann_cur_id)
            set_ann_bar(ann_now["start"], ann_now["end"], ann_cur_id, color=color='red')
        }
    }
})

// next ann
Mousetrap.bind('r', () => {
    if (ann_now["end"] - ann_now["start"] > 0.1) {
        let length_now = ann_all["video"][cur_video_id]["action"].length
        if (ann_cur_id === length_now) {
            ann_all["video"][cur_video_id]["action"].push(
                {
                    "category": actino_now, 
                    "start": ann_now["start"],
                    "end": ann_now["end"]
                }
            )
        } else {
            ann_all["video"][cur_video_id]["action"][ann_cur_id]["category"] = actino_now
            ann_all["video"][cur_video_id]["action"][ann_cur_id]["start"] = ann_now["start"]
            ann_all["video"][cur_video_id]["action"][ann_cur_id]["end"] = ann_now["end"]
        }
        $('#ann_bar_'+ann_cur_id).css({
            'background-color': color_now
        });
        action_now = $('#text_action_category').val()
        let action_idx = get_action_idx(action_now)
        if (action_idx < 0) {
            action_list.push(actino_now)
            action_color.push(color_now)
            $("#action_select").append('<option class="action_select_item" value="'+action_now+'" style="background-color:'+color_now+'">'+action_now+'</option>')
        }
        reset_ann()
        ann_cur_id = ann_all["video"][cur_video_id]["action"].length
    }
})

// save
Mousetrap.bind('w', () => {
    save_json()
    save_signal()
})

// load project
Mousetrap.bind('ctrl+i', () => {
    load_project()
})
