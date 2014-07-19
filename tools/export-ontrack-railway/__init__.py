
bl_info={
  "name":"Export onTrack railway",
  "category":"Import-Export",
  "author":"Jon Ross",
  "description": "Export to onTrack railway",
  "location":"File > Export > onTrack railway",
  "version":(0,1),
  "blender":(2,71,0),
  "warning":"WIP",
}

import bmesh
import time
import bpy
import json
from bpy.props import *
import math
from bpy_extras.io_utils import ExportHelper
import os

# EXPORT

def export():
  out={}

  t=time.strftime("%B %d, %Y %H:%M:%S")

  #  out+="# Generated at "+t+" with the OnTrackRailway exporter for Blender"
  #  out+="# Blender version: "+bpy.app.version_string+"\n\n"

  #for o in bpy.data.objects:
  #    if o.type != "MESH":
  return json.dumps(out)

class ExportOnTrackRailway(bpy.types.Operator,ExportHelper):
  """Exports the file as a onTrack railway"""
  bl_idname="export_scene.ontrack_railway"
  bl_label="Export onTrack railway"
  filename_ext=".otr"
 
  def execute(self,context):
    filepath=self.filepath
    e=export()
    open(filepath,"w").write(e)
    return {"FINISHED"}

  def invoke(self,context,event):
    wm=context.window_manager
    wm.fileselect_add(self)
    return {"RUNNING_MODAL"}

class AddOnTrackRailwayObject(bpy.types.Operator):
  """Adds an onTrack railway object"""
  bl_idname="mesh.ontrack_object_add"
  bl_label="Add onTrack object"

  def getName(self):
    return "onTrack object"

  def add(self):
    return ([],[],[])

  def execute(self,context):
    bpy.context.user_preferences.edit.use_global_undo=False
    mesh = bpy.data.meshes.new(self.getName())

    verts, edges, faces=self.add()
    mesh.from_pydata(verts, edges, faces)

    mesh.update()

    bpy.ops.object.add(type="MESH")
    ob=bpy.context.object
    ob.data=mesh
    ob.select = True
    bpy.context.user_preferences.edit.use_global_undo=True
    return {"FINISHED"}

class AddOnTrackRailwayRoot(AddOnTrackRailwayObject):
  """Adds an onTrack railway root"""
  bl_idname="mesh.ontrack_root_add"
  bl_label="Add onTrack root"

  def getName(self):
    return "object root"

  def add(self):
    verts=[]
    edges=[]
    faces=[]

    for i in range(0,200):
      verts.append([math.sin(i/200*math.pi*2),math.cos(i/200*math.pi*2),0]);
      if i%2 == 0:
        edges.append([i-1,i])
    return (verts,edges,faces)

 
class OnTrackRailwaySettings(bpy.types.PropertyGroup):

  Name=bpy.props.StringProperty(
    name="Railway name",
    description="The name of the railway (e.g. 'BART Fremont-Richmond')",
    default="Untitled railway")

  Version=bpy.props.StringProperty(
    name="Railway version",
    description="The revision number of this railway; can be any string",
    default="0.1")

  Gauge=bpy.props.FloatProperty(
    name="Railway gauge",
    description="The distance between the inner edge of the two rails",
    subtype="DISTANCE",
    default=1.435)

def onTrackRailwayRootUpdate(self,context):
  OnTrackRailwayRoot=context.active_object.OnTrackRailwayRoot
  for mesh in bpy.data.meshes:
    if mesh.name == "railway end":
      pass

class OnTrackRailwayRootSettings(bpy.types.PropertyGroup):

  Type=bpy.props.EnumProperty(
    name="Root type",
    description="The root node type",
    items=[
      ("none","None","This object is not a root"),
      ("master-track","Master","This object is a track root for the user-controlled train"),
      ("track","Track","This object is a track root for trains"),
      ("road","Road","This object is a road root for wheeled vehicles"),
      ("object","Object","This object is a root position for other objects"),
    ],
    default="none",
    update=onTrackRailwayRootUpdate)

# Panels

class OnTrackRailwayWorldOptionsPanel(bpy.types.Panel):
  """onTrack Railway Options"""
  bl_label="onTrack Railway Options"
  bl_space_type="PROPERTIES"
  bl_region_type="WINDOW"
  bl_context="world"

  def draw(self,context):
    layout=self.layout
    OnTrackRailway=bpy.context.scene.world.OnTrackRailway
    layout.prop(OnTrackRailway,"Name")
    layout.prop(OnTrackRailway,"Version")
    layout.prop(OnTrackRailway,"Gauge")

class OnTrackRailwayRootPanel(bpy.types.Panel):
  """onTrack Railway Root"""
  bl_label="onTrack Root"
  bl_space_type="PROPERTIES"
  bl_region_type="WINDOW"
  bl_context="object"

  @classmethod
  def poll(self,context):
    obj=bpy.context.active_object
    if obj.type == "MESH":
      return True
    return False

  def draw(self,context):
    layout=self.layout
    row=layout.row(align=True)
    OnTrackRailwayRoot=bpy.context.active_object.OnTrackRailwayRoot
    row.prop(OnTrackRailwayRoot,"Type")

# Menu

class OnTrackRailwayMenu(bpy.types.Menu):
  """Add item for an onTrack railway"""
  bl_idname="onTrack_railway_add"
  bl_label="onTrack railway"

  def draw(self,context):
    layout=self.layout
    layout.operator_context="INVOKE_REGION_WIN"
    layout.operator(AddOnTrackRailwayRoot.bl_idname, text="Root")

def export_menu_func(self,context):
  self.layout.operator(ExportOnTrackRailway.bl_idname,text="onTrack railway (.otr)")

def add_menu_func(self,context):
  self.layout.menu(OnTrackRailwayMenu.bl_idname, icon="PLUGIN")

def register():
  bpy.utils.register_module(__name__)
  bpy.types.World.OnTrackRailway=bpy.props.PointerProperty(type=OnTrackRailwaySettings)
  bpy.types.Object.OnTrackRailwayRoot=bpy.props.PointerProperty(type=OnTrackRailwayRootSettings)
  bpy.types.INFO_MT_file_export.append(export_menu_func)
  bpy.types.INFO_MT_mesh_add.append(add_menu_func)

def unregister():
  bpy.utils.unregister_module(__name__)
  bpy.types.INFO_MT_file_export.remove(export_menu_func)
  bpy.types.INFO_MT_mesh_add.remove(add_menu_func)

