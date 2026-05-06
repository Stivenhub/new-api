package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// GetAllOrganizations 获取组织列表（分页）
func GetAllOrganizations(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	orgs, total, err := model.GetAllOrganizations(pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(orgs)
	common.ApiSuccess(c, pageInfo)
}

// SearchOrganizations 搜索组织
func SearchOrganizations(c *gin.Context) {
	keyword := c.Query("keyword")
	pageInfo := common.GetPageQuery(c)
	orgs, total, err := model.SearchOrganizations(keyword, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(orgs)
	common.ApiSuccess(c, pageInfo)
}

// GetOrganization 根据 ID 获取组织
func GetOrganization(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	org, err := model.GetOrganizationByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, org)
}

// CreateOrganization 新建组织
func CreateOrganization(c *gin.Context) {
	var req dto.CreateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Name == "" {
		common.ApiErrorMsg(c, "组织名称不能为空")
		return
	}
	if req.Code == "" {
		common.ApiErrorMsg(c, "组织编码不能为空")
		return
	}
	if dup, err := model.IsOrgNameDuplicated(0, req.Name); err != nil {
		common.ApiError(c, err)
		return
	} else if dup {
		common.ApiErrorMsg(c, "组织名称已存在")
		return
	}
	if dup, err := model.IsOrgCodeDuplicated(0, req.Code); err != nil {
		common.ApiError(c, err)
		return
	} else if dup {
		common.ApiErrorMsg(c, "组织编码已存在")
		return
	}
	status := 1
	if req.Status != nil {
		status = *req.Status
	}
	org := model.Organization{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Status:      status,
	}
	if err := org.Insert(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, &org)
}

// UpdateOrganization 更新组织
func UpdateOrganization(c *gin.Context) {
	var req dto.UpdateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Id == 0 {
		common.ApiErrorMsg(c, "缺少组织 ID")
		return
	}
	existing, err := model.GetOrganizationByID(req.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Name != "" {
		if dup, err := model.IsOrgNameDuplicated(req.Id, req.Name); err != nil {
			common.ApiError(c, err)
			return
		} else if dup {
			common.ApiErrorMsg(c, "组织名称已存在")
			return
		}
		existing.Name = req.Name
	}
	if req.Code != "" {
		if dup, err := model.IsOrgCodeDuplicated(req.Id, req.Code); err != nil {
			common.ApiError(c, err)
			return
		} else if dup {
			common.ApiErrorMsg(c, "组织编码已存在")
			return
		}
		existing.Code = req.Code
	}
	if req.Description != "" {
		existing.Description = req.Description
	}
	if req.Status != nil {
		existing.Status = *req.Status
	}
	if err := existing.Update(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, existing)
}

// DeleteOrganization 删除组织
func DeleteOrganization(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	// 清理关联
	model.DeleteUserOrganizationsByOrgId(id)
	if err := model.DeleteOrganizationByID(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// GetOrganizationUsers 获取组织下的用户列表
func GetOrganizationUsers(c *gin.Context) {
	idStr := c.Param("id")
	orgId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo := common.GetPageQuery(c)
	users, total, err := model.GetOrganizationUsers(orgId, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(users)
	common.ApiSuccess(c, pageInfo)
}

// AddOrganizationUsers 批量添加用户到组织
func AddOrganizationUsers(c *gin.Context) {
	idStr := c.Param("id")
	orgId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req dto.OrganizationUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.BatchAddUsersToOrganization(req.UserIds, orgId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// RemoveOrganizationUsers 批量从组织中移除用户
func RemoveOrganizationUsers(c *gin.Context) {
	idStr := c.Param("id")
	orgId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req dto.OrganizationUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.BatchRemoveUsersFromOrganization(req.UserIds, orgId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
