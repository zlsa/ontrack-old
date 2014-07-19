
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
    if mesh.name == ""

class OnTrackRailwayRootSettings(bpy.types.PropertyGroup):

  Type=bpy.props.EnumProperty(
    name="Root type",
    description="The root node type",
    items=[
      ("none","None","This object is not a root"),
      ("master-track","Master","This object is a track root for the user-controlled train"),
      ("track","Track","This object is a track root for trains"),
      ("road","Road","This object is a road root for wheeled vehicles"),
    ],
    default="none",
    update=onTrackRailwayRootUpdate)

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

def menu_func(self,context):
  self.layout.operator(ExportOnTrackRailway.bl_idname,text="onTrack railway (.otr)")

def register():
  bpy.utils.register_module(__name__)
  bpy.types.World.OnTrackRailway=bpy.props.PointerProperty(type=OnTrackRailwaySettings)
  bpy.types.Object.OnTrackRailwayRoot=bpy.props.PointerProperty(type=OnTrackRailwayRootSettings)
  bpy.types.INFO_MT_file_export.append(menu_func)

def unregister():
  bpy.utils.unregister_module(__name__)
  bpy.types.INFO_MT_file_export.remove(menu_func)

